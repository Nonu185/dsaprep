const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const DailyPlan = require('../models/DailyPlan');
const { getRevisionSchedule } = require('../services/revisionService');
const { normalizeLanguage } = require('../utils/languageUtils');

const PROGRESS_FIELDS = [
  'attempts', 'bookmarked', 'isImportant', 'notes', 'approach',
  'bruteForce', 'optimizedApproach', 'timeComplexity', 'spaceComplexity',
  'edgeCases', 'mistakes', 'keyLearning'
];

exports.updateProgress = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { language = 'Java', status } = req.body;
    const canonicalLang = normalizeLanguage(language);

    const question = await Question.findOne({
      $or: [{ questionId }, { stableId: questionId }]
    });

    if (!question) {
      return res.status(404).json({ success: false, message: `Question '${questionId}' not found.` });
    }

    let progress = await UserQuestionProgress.findOne({
      userId: req.user._id,
      questionId: question.questionId,
      language: canonicalLang
    });

    if (!progress) {
      progress = new UserQuestionProgress({
        userId: req.user._id,
        questionId: question.questionId,
        questionNumber: question.questionNumber,
        questionType: question.questionType || 'DSA',
        language: canonicalLang
      });
    }

    const previousStatus = progress.status;

    if (status !== undefined) {
      const isNowCompleted = status === 'Completed' || status === 'Solved';
      const wasCompleted = previousStatus === 'Completed' || previousStatus === 'Solved';

      progress.status = status;

      if (isNowCompleted && !wasCompleted) {
        progress.solvedAt = new Date();
        const intervals = req.user.preferences?.revisionIntervals || [1, 3, 7, 14, 30];
        const schedule = getRevisionSchedule(progress.solvedAt, 0, intervals);
        progress.nextRevisionAt = schedule.nextRevisionAt;
        progress.revisionLevel = 0;
      } else if (!isNowCompleted && wasCompleted) {
        progress.solvedAt = null;
        progress.nextRevisionAt = null;
        progress.revisionLevel = 0;
      }
    }

    PROGRESS_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) progress[f] = req.body[f];
    });

    progress.lastAttemptedAt = new Date();
    await progress.save();

    // Sync today's daily plan if question is in plan
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPlan = await DailyPlan.findOne({ userId: req.user._id, date: todayStr });
    if (todayPlan) {
      let modified = false;
      const isCompleted = status === 'Completed' || status === 'Solved';

      todayPlan.questions.forEach(q => {
        if (q.questionId === question.questionId) {
          if (isCompleted) {
            q.status = 'Completed';
            q.completedAt = new Date();
            modified = true;
          } else if (status === 'Attempted') {
            q.status = 'Attempted';
            modified = true;
          } else if (status === 'Not Started') {
            q.status = 'Not Started';
            q.completedAt = null;
            modified = true;
          }
        }
      });

      if (modified) {
        const completedCount = todayPlan.questions.filter(q => q.status === 'Completed' || q.status === 'Solved').length;
        todayPlan.summary.completedCount = completedCount;
        todayPlan.summary.isMet = completedCount >= todayPlan.summary.target;
        await todayPlan.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully.',
      data: progress
    });
  } catch (err) {
    next(err);
  }
};

exports.getProgressMap = async (req, res, next) => {
  try {
    const { language = 'Java' } = req.query;
    const canonicalLang = normalizeLanguage(language);

    const list = await UserQuestionProgress.find({
      userId: req.user._id,
      language: canonicalLang
    })
      .select('questionId questionNumber questionType language status bookmarked isImportant attempts lastAttemptedAt nextRevisionAt solvedAt')
      .lean();

    const map = {};
    list.forEach(item => {
      map[item.questionId] = item;
    });

    res.status(200).json({
      success: true,
      language: canonicalLang,
      data: map
    });
  } catch (err) {
    next(err);
  }
};
