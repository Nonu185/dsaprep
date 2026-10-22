const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const { getRevisionSchedule, calculateNextRevisionDate } = require('../services/revisionService');

exports.getRevisionQueue = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const solvedItems = await UserQuestionProgress.find({
      userId: req.user._id,
      status: { $in: ['Completed', 'Solved'] },
      nextRevisionAt: { $exists: true, $ne: null }
    }).sort({ nextRevisionAt: 1 }).lean();

    const qIds = solvedItems.map(i => i.questionId);
    const metaList = await Question.find({ questionId: { $in: qIds } }).lean();
    const metaMap = new Map(metaList.map(m => [m.questionId, m]));

    const overdue = [];
    const dueToday = [];
    const upcoming = [];

    solvedItems.forEach(item => {
      const qMeta = metaMap.get(item.questionId) || {};
      const enriched = {
        ...item,
        title: qMeta.title || '',
        topic: qMeta.topic || '',
        difficulty: qMeta.difficulty || 'Medium',
        pattern: qMeta.pattern || '',
        practiceUrl: qMeta.practiceUrl || ''
      };

      const revDate = new Date(item.nextRevisionAt);
      if (revDate < startOfToday) {
        overdue.push(enriched);
      } else if (revDate >= startOfToday && revDate <= endOfToday) {
        dueToday.push(enriched);
      } else {
        upcoming.push(enriched);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        overdue,
        dueToday,
        upcoming,
        totalInQueue: solvedItems.length
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.completeRevision = async (req, res, next) => {
  try {
    const { questionId, recalledIndependently, notes } = req.body;

    const progress = await UserQuestionProgress.findOne({
      userId: req.user._id,
      questionId
    });

    if (!progress) {
      return res.status(404).json({ success: false, message: 'Question progress not found.' });
    }

    const currentLevel = progress.revisionLevel || 0;
    const intervals = req.user.preferences?.revisionIntervals || [1, 3, 7, 14, 30];

    // Record in history
    progress.revisionHistory.push({
      revisionIndex: currentLevel + 1,
      completedAt: new Date(),
      recalledIndependently: recalledIndependently !== false,
      notes: notes || ''
    });

    // Advance to next level
    const nextLevel = currentLevel + 1;
    progress.revisionLevel = nextLevel;

    // Schedule next
    const schedule = getRevisionSchedule(new Date(), nextLevel, intervals);
    progress.nextRevisionAt = schedule.nextRevisionAt;

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Revision completed and next revision scheduled.',
      data: progress
    });
  } catch (err) {
    next(err);
  }
};

exports.rescheduleRevision = async (req, res, next) => {
  try {
    const { questionId, daysFromNow = 1 } = req.body;

    const progress = await UserQuestionProgress.findOne({
      userId: req.user._id,
      questionId
    });

    if (!progress) {
      return res.status(404).json({ success: false, message: 'Question progress not found.' });
    }

    const newDate = calculateNextRevisionDate(new Date(), parseInt(daysFromNow, 10));
    progress.nextRevisionAt = newDate;
    await progress.save();

    res.status(200).json({
      success: true,
      message: `Revision rescheduled to ${newDate.toISOString().split('T')[0]}.`,
      data: progress
    });
  } catch (err) {
    next(err);
  }
};
