const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const DailyPlan = require('../models/DailyPlan');

exports.getAnalyticsSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Total DSA questions in database (strictly 180)
    const dsaQuestions = await Question.find({ questionType: 'DSA' }).select('questionId difficulty topic').lean();
    const totalQuestions = dsaQuestions.length;

    // 2. User progress records
    const userProgress = await UserQuestionProgress.find({ userId }).lean();

    // DSA sets
    const dsaCompletedSet = new Set();
    const dsaAttemptedSet = new Set();
    const dsaNeedsRevSet = new Set();

    userProgress.forEach(p => {
      const isCompleted = p.status === 'Completed' || p.status === 'Solved';

      if (isCompleted) {
        dsaCompletedSet.add(p.questionId);
      } else if (p.status === 'Attempted') {
        dsaAttemptedSet.add(p.questionId);
      } else if (p.status === 'Needs Revision') {
        dsaNeedsRevSet.add(p.questionId);
      }
    });

    // Completed takes precedence
    dsaCompletedSet.forEach(id => {
      dsaAttemptedSet.delete(id);
      dsaNeedsRevSet.delete(id);
    });

    const solvedCount = dsaCompletedSet.size;
    const attemptedCount = dsaAttemptedSet.size;
    const needsRevisionCount = dsaNeedsRevSet.size;
    const remainingCount = Math.max(0, totalQuestions - solvedCount);
    const notStartedCount = Math.max(0, totalQuestions - (solvedCount + attemptedCount + needsRevisionCount));
    const completionPercentage = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;

    // 3. Difficulty and Topic breakdown
    const difficultyStats = {
      Easy: { total: 0, solved: 0 },
      Medium: { total: 0, solved: 0 },
      Hard: { total: 0, solved: 0 }
    };

    const topicStats = {};

    dsaQuestions.forEach(q => {
      const diff = q.difficulty || 'Medium';
      if (!difficultyStats[diff]) difficultyStats[diff] = { total: 0, solved: 0 };
      difficultyStats[diff].total++;

      const top = q.topic || 'Other';
      if (!topicStats[top]) topicStats[top] = { total: 0, solved: 0, attempted: 0, needsRevision: 0 };
      topicStats[top].total++;

      if (dsaCompletedSet.has(q.questionId)) {
        difficultyStats[diff].solved++;
        topicStats[top].solved++;
      } else if (dsaAttemptedSet.has(q.questionId)) {
        topicStats[top].attempted++;
      } else if (dsaNeedsRevSet.has(q.questionId)) {
        topicStats[top].needsRevision++;
      }
    });

    // 4. Today's Plan & Target
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPlan = await DailyPlan.findOne({ userId, date: todayStr }).lean();
    const target = req.user.preferences?.dailyTarget || 5;
    const todayCompletedCount = todayPlan ? todayPlan.summary.completedCount : 0;

    // 5. Streak calculation
    const solvedDates = new Set();
    userProgress.forEach(p => {
      if (p.solvedAt) {
        solvedDates.add(new Date(p.solvedAt).toISOString().split('T')[0]);
      }
    });

    const pastPlans = await DailyPlan.find({ userId, 'summary.completedCount': { $gt: 0 } }).select('date').lean();
    pastPlans.forEach(p => solvedDates.add(p.date));

    let currentStreak = 0;
    let longestStreak = 0;
    let checkDate = new Date();

    const todayDateKey = checkDate.toISOString().split('T')[0];
    if (!solvedDates.has(todayDateKey)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (solvedDates.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const sortedDates = Array.from(solvedDates).sort();
    let tempStreak = 0;
    let prevDate = null;

    sortedDates.forEach(dateStr => {
      const d = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      prevDate = d;
    });

    // 6. Due revisions count
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dueRevisions = await UserQuestionProgress.find({
      userId,
      status: { $in: ['Completed', 'Solved'] },
      nextRevisionAt: { $lte: endOfToday }
    }).select('questionId nextRevisionAt revisionLevel').lean();

    const dueRevisionsCount = dueRevisions.length;

    // 7. Weekly solving chart (Last 7 days)
    const weeklySolving = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const count = userProgress.filter(p => p.solvedAt && new Date(p.solvedAt).toISOString().split('T')[0] === dKey).length;
      weeklySolving.push({
        date: dKey,
        day: dayName,
        solved: count
      });
    }

    // 8. Topics needing improvement
    const topicsNeedingImprovement = Object.entries(topicStats)
      .map(([topic, data]) => ({
        topic,
        ...data,
        completionRate: data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0
      }))
      .filter(t => t.total > 0 && t.completionRate < 60)
      .sort((a, b) => b.needsRevision - a.needsRevision || a.completionRate - b.completionRate)
      .slice(0, 5);

    // 9. Recent manual status changes / activity
    const recentProgressUpdates = await UserQuestionProgress.find({
      userId,
      status: { $in: ['Completed', 'Solved', 'Attempted', 'Needs Revision', 'Revisit Later'] }
    })
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean();

    const progQIds = recentProgressUpdates.map(s => s.questionId);
    const progQMeta = await Question.find({ questionId: { $in: progQIds } }).select('questionId title topic difficulty practiceUrl platform').lean();
    const progQMetaMap = new Map(progQMeta.map(m => [m.questionId, m]));

    const recentActivity = recentProgressUpdates.map(p => {
      const q = progQMetaMap.get(p.questionId) || {};
      return {
        id: p._id,
        questionId: p.questionId,
        title: q.title || p.questionId,
        topic: q.topic || '',
        difficulty: q.difficulty || '',
        status: p.status === 'Solved' ? 'Completed' : p.status,
        practiceUrl: q.practiceUrl || '',
        platform: q.platform || '',
        createdAt: p.updatedAt || p.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalQuestions,
        solvedCount,
        attemptedCount,
        needsRevisionCount,
        remainingCount,
        notStartedCount,
        completionPercentage,
        difficultyStats,
        topicStats,
        todayTarget: target,
        todayCompletedCount,
        currentStreak,
        longestStreak,
        dueRevisionsCount,
        weeklySolving,
        topicsNeedingImprovement,
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
};
