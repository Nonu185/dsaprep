const DailyPlan = require('../models/DailyPlan');
const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { getRevisionSchedule } = require('../services/revisionService');

/**
 * Helper to generate questions strictly from 180 DSA questions
 */
const generatePlanQuestions = async (userId, target = 5) => {
  const solvedList = await UserQuestionProgress.find({
    userId,
    status: { $in: ['Completed', 'Solved'] }
  }).select('questionId');

  const solvedIds = new Set(solvedList.map(s => s.questionId));

  // Fetch DSA questions
  const availableDSA = await Question.find({ questionType: 'DSA' })
    .sort({ questionNumber: 1 })
    .lean();

  const selectedDSA = [];
  for (const q of availableDSA) {
    if (!solvedIds.has(q.questionId)) {
      selectedDSA.push(q);
      if (selectedDSA.length >= target) break;
    }
  }
  // If not enough unsolved DSA, fill from remaining
  if (selectedDSA.length < target) {
    for (const q of availableDSA) {
      if (!selectedDSA.some(sq => sq.questionId === q.questionId)) {
        selectedDSA.push(q);
        if (selectedDSA.length >= target) break;
      }
    }
  }

  return selectedDSA.map((q, idx) => ({
    questionId: q.questionId,
    questionNumber: q.questionNumber,
    questionType: 'DSA',
    order: idx + 1,
    status: 'Not Started'
  }));
};

exports.getTodayPlan = async (req, res, next) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const target = parseInt(req.user.preferences?.dailyTarget, 10) || 5;

    let plan = await DailyPlan.findOne({ userId: req.user._id, date: dateStr });

    if (!plan) {
      const questions = await generatePlanQuestions(req.user._id, target);

      plan = await DailyPlan.create({
        userId: req.user._id,
        date: dateStr,
        target,
        questions,
        summary: {
          target,
          completedCount: 0,
          isMet: false
        }
      });
    }

    // Hydrate questions with title, topic, difficulty, practiceUrl, platform, and user progress
    const qIds = plan.questions.map(q => q.questionId);
    const questionsMeta = await Question.find({ questionId: { $in: qIds } }).lean();
    const metaMap = new Map(questionsMeta.map(m => [m.questionId, m]));

    const progressList = await UserQuestionProgress.find({
      userId: req.user._id,
      questionId: { $in: qIds }
    }).lean();
    const progressMap = new Map(progressList.map(p => [p.questionId, p]));

    const hydratedQuestions = plan.questions.map(item => {
      const meta = metaMap.get(item.questionId) || {};
      const userProg = progressMap.get(item.questionId) || {};
      return {
        ...item.toObject ? item.toObject() : item,
        title: meta.title || '',
        topic: meta.topic || '',
        difficulty: meta.difficulty || 'Medium',
        practiceUrl: meta.practiceUrl || '',
        platform: meta.platform || '',
        userOverallStatus: userProg.status || 'Not Started',
        attempts: userProg.attempts || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        id: plan._id,
        date: plan.date,
        target: plan.target,
        summary: plan.summary,
        questions: hydratedQuestions
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.generateOrCustomizePlan = async (req, res, next) => {
  try {
    const { date, target = 5 } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    const safeTarget = Math.max(1, parseInt(target, 10));
    const questions = await generatePlanQuestions(req.user._id, safeTarget);

    let plan = await DailyPlan.findOne({ userId: req.user._id, date: dateStr });

    if (plan) {
      plan.target = safeTarget;
      plan.questions = questions;
      const completedCount = questions.filter(q => q.status === 'Completed' || q.status === 'Solved').length;
      plan.summary = {
        target: safeTarget,
        completedCount,
        isMet: completedCount >= safeTarget
      };
      await plan.save();
    } else {
      plan = await DailyPlan.create({
        userId: req.user._id,
        date: dateStr,
        target: safeTarget,
        questions,
        summary: {
          target: safeTarget,
          completedCount: 0,
          isMet: false
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Daily plan configured and regenerated successfully.',
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePlanItemStatus = async (req, res, next) => {
  try {
    const { date, questionId, status } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    const plan = await DailyPlan.findOne({ userId: req.user._id, date: dateStr });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found for date.' });
    }

    const item = plan.questions.find(q => q.questionId === questionId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Question not found in daily plan.' });
    }

    const isCompleted = status === 'Completed' || status === 'Solved';
    item.status = status;
    if (isCompleted) {
      item.completedAt = new Date();
    } else {
      item.completedAt = null;
    }

    const completedCount = plan.questions.filter(q => q.status === 'Completed' || q.status === 'Solved').length;
    plan.summary.completedCount = completedCount;
    plan.summary.isMet = completedCount >= plan.summary.target;

    await plan.save();

    // Also sync UserQuestionProgress
    let progress = await UserQuestionProgress.findOne({
      userId: req.user._id,
      questionId
    });

    if (!progress) {
      const qMeta = await Question.findOne({ questionId });
      if (qMeta) {
        progress = new UserQuestionProgress({
          userId: req.user._id,
          questionId: qMeta.questionId,
          questionNumber: qMeta.questionNumber,
          questionType: qMeta.questionType || 'DSA',
          language: req.user.preferences?.preferredLanguage || 'Java'
        });
      }
    }

    if (progress) {
      progress.status = status;
      if (isCompleted) {
        progress.solvedAt = new Date();
        const intervals = req.user.preferences?.revisionIntervals || [1, 3, 7, 14, 30];
        const schedule = getRevisionSchedule(progress.solvedAt, 0, intervals);
        progress.nextRevisionAt = schedule.nextRevisionAt;
      } else {
        progress.solvedAt = null;
        progress.nextRevisionAt = null;
      }
      progress.lastAttemptedAt = new Date();
      await progress.save();
    }

    res.status(200).json({
      success: true,
      message: 'Plan item status updated and synced to progress.',
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

exports.replacePlanQuestion = async (req, res, next) => {
  try {
    const { date, oldQuestionId, newQuestionId } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    const plan = await DailyPlan.findOne({ userId: req.user._id, date: dateStr });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found for date.' });
    }

    // Check duplicate
    if (plan.questions.some(q => q.questionId === newQuestionId)) {
      return res.status(400).json({
        success: false,
        message: 'The new question is already present in today\'s plan. Duplicates are not allowed.'
      });
    }

    const newQ = await Question.findOne({
      $or: [{ questionId: newQuestionId }, { stableId: newQuestionId }]
    });

    if (!newQ) {
      return res.status(404).json({ success: false, message: 'New question not found.' });
    }

    const itemIdx = plan.questions.findIndex(q => q.questionId === oldQuestionId);
    if (itemIdx === -1) {
      return res.status(404).json({ success: false, message: 'Old question not in plan.' });
    }

    plan.questions[itemIdx].questionId = newQ.questionId;
    plan.questions[itemIdx].questionNumber = newQ.questionNumber;
    plan.questions[itemIdx].questionType = newQ.questionType || 'DSA';
    plan.questions[itemIdx].status = 'Not Started';
    plan.questions[itemIdx].completedAt = null;

    const completedCount = plan.questions.filter(q => q.status === 'Completed' || q.status === 'Solved').length;
    plan.summary.completedCount = completedCount;
    plan.summary.isMet = completedCount >= plan.summary.target;

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Question swapped successfully in daily plan.',
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

exports.reorderPlanQuestions = async (req, res, next) => {
  try {
    const { date, orderedQuestionIds } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    const plan = await DailyPlan.findOne({ userId: req.user._id, date: dateStr });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const itemMap = new Map(plan.questions.map(q => [q.questionId, q]));
    const reordered = [];

    orderedQuestionIds.forEach((qId, idx) => {
      const item = itemMap.get(qId);
      if (item) {
        item.order = idx + 1;
        reordered.push(item);
      }
    });

    plan.questions.forEach(item => {
      if (!orderedQuestionIds.includes(item.questionId)) {
        item.order = reordered.length + 1;
        reordered.push(item);
      }
    });

    plan.questions = reordered;
    await plan.save();

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

exports.getMissedQuestions = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const pastPlans = await DailyPlan.find({
      userId: req.user._id,
      date: { $lt: todayStr }
    }).sort({ date: -1 }).limit(14).lean();

    const missed = [];
    const missedQIds = new Set();

    pastPlans.forEach(plan => {
      if (Array.isArray(plan.questions)) {
        plan.questions.forEach(q => {
          if (q.status !== 'Completed' && q.status !== 'Solved') {
            if (!missedQIds.has(q.questionId)) {
              missedQIds.add(q.questionId);
              missed.push({
                questionId: q.questionId,
                questionNumber: q.questionNumber,
                questionType: q.questionType || 'DSA',
                planDate: plan.date
              });
            }
          }
        });
      }
    });

    if (missed.length > 0) {
      const qMeta = await Question.find({ questionId: { $in: Array.from(missedQIds) } }).lean();
      const metaMap = new Map(qMeta.map(m => [m.questionId, m]));
      missed.forEach(m => {
        const meta = metaMap.get(m.questionId) || {};
        m.title = meta.title || m.questionId;
        m.topic = meta.topic || '';
        m.difficulty = meta.difficulty || 'Medium';
      });
    }

    res.status(200).json({
      success: true,
      count: missed.length,
      data: missed
    });
  } catch (err) {
    next(err);
  }
};

