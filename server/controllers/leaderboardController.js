const Question = require('../models/Question');
const User = require('../models/User');
const UserQuestionProgress = require('../models/UserQuestionProgress');

// Standard difficulty points
const DIFFICULTY_POINTS = {
  Easy: 10,
  Medium: 20,
  Hard: 30
};

// Filter to exclude test/demo accounts created by automated test runners
const TEST_ACCOUNT_FILTER = {
  email: {
    $not: /(@example\.com|^test_user_|^manual_qa_|^second_qa_|^google_student_)/i
  },
  name: {
    $nin: ['Candidate A', 'Candidate B', 'QA Candidate', 'Second Candidate', 'Google Student', 'Test User']
  }
};

/**
 * GET /api/leaderboard
 * Fetches real user rankings based strictly on actual DSA progress stored in MongoDB.
 * Never exposes private emails, auth tokens, or sensitive credentials.
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const currentUserId = req.user ? req.user._id.toString() : null;

    // 1. Fetch all 180 DSA questions with difficulty
    const questions = await Question.find({ questionType: 'DSA' })
      .select('questionId difficulty')
      .lean();

    const totalDsaCount = questions.length || 180;
    const questionDiffMap = new Map();
    questions.forEach(q => {
      questionDiffMap.set(q.questionId, q.difficulty || 'Medium');
    });

    // 2. Fetch all real registered users (excluding automated test accounts)
    const rawUsers = await User.find(TEST_ACCOUNT_FILTER)
      .select('_id name avatar createdAt')
      .lean();

    // Deduplicate users by distinct ID
    const userMap = new Map();
    rawUsers.forEach(u => {
      const uid = u._id.toString();
      if (!userMap.has(uid)) {
        userMap.set(uid, u);
      }
    });
    const users = Array.from(userMap.values());
    const eligibleUserIds = users.map(u => u._id);

    // 3. Fetch all completed DSA progress records strictly for eligible real users
    const completedProgress = await UserQuestionProgress.find({
      userId: { $in: eligibleUserIds },
      questionType: 'DSA',
      status: { $in: ['Completed', 'Solved'] }
    })
      .select('userId questionId solvedAt updatedAt createdAt')
      .lean();

    // 4. Map distinct completed questions per user (only counting valid 180 DSA questions)
    const userProgressMap = new Map();
    completedProgress.forEach(p => {
      if (!p.userId || !questionDiffMap.has(p.questionId)) return;
      const uid = p.userId.toString();
      if (!userProgressMap.has(uid)) {
        userProgressMap.set(uid, {
          completedQuestions: new Map(),
          lastCompletedAt: null
        });
      }

      const uData = userProgressMap.get(uid);
      const compTime = p.solvedAt || p.updatedAt || p.createdAt || new Date(0);

      if (!uData.completedQuestions.has(p.questionId)) {
        uData.completedQuestions.set(p.questionId, compTime);
      }

      if (!uData.lastCompletedAt || new Date(compTime) > new Date(uData.lastCompletedAt)) {
        uData.lastCompletedAt = compTime;
      }
    });

    // 5. Build ranked records for every real user
    const rankedUsers = users.map(user => {
      const uid = user._id.toString();
      const uData = userProgressMap.get(uid);

      let points = 0;
      let easyCount = 0;
      let mediumCount = 0;
      let hardCount = 0;
      let completedCount = 0;
      let lastCompletedAt = user.createdAt || new Date(0);

      if (uData) {
        completedCount = uData.completedQuestions.size;
        if (uData.lastCompletedAt) {
          lastCompletedAt = uData.lastCompletedAt;
        }

        for (const qId of uData.completedQuestions.keys()) {
          const diff = questionDiffMap.get(qId) || 'Medium';
          points += (DIFFICULTY_POINTS[diff] || 20);
          if (diff === 'Easy') easyCount++;
          else if (diff === 'Hard') hardCount++;
          else mediumCount++;
        }
      }

      const completionPercentage = totalDsaCount > 0
        ? Math.round((completedCount / totalDsaCount) * 1000) / 10
        : 0;

      return {
        userId: uid,
        name: user.name || 'Candidate',
        avatar: user.avatar || '',
        points,
        completedCount,
        totalQuestions: totalDsaCount,
        completionPercentage,
        breakdown: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount
        },
        lastCompletedAt,
        userCreatedAt: user.createdAt,
        isCurrentUser: currentUserId ? uid === currentUserId : false
      };
    });

    // 6. Deterministic tie-breaking sort:
    //    1. points DESC
    //    2. completedCount DESC
    //    3. lastCompletedAt ASC (earlier completion timestamp wins)
    //    4. userCreatedAt ASC (earlier registration timestamp wins)
    //    5. name ASC
    //    6. userId ASC
    rankedUsers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;

      const timeA = new Date(a.lastCompletedAt).getTime();
      const timeB = new Date(b.lastCompletedAt).getTime();
      if (timeA !== timeB) return timeA - timeB;

      const regA = new Date(a.userCreatedAt).getTime();
      const regB = new Date(b.userCreatedAt).getTime();
      if (regA !== regB) return regA - regB;

      const nameComp = (a.name || '').localeCompare(b.name || '');
      if (nameComp !== 0) return nameComp;

      return a.userId.localeCompare(b.userId);
    });

    // 7. Assign 1-based ranks
    rankedUsers.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    // 8. Find current user's standing
    const currentUser = currentUserId
      ? rankedUsers.find(u => u.isCurrentUser) || null
      : null;

    // 9. Optional search filter
    const search = (req.query.search || '').trim().toLowerCase();
    let displayList = rankedUsers;
    if (search) {
      displayList = rankedUsers.filter(u => u.name.toLowerCase().includes(search));
    }

    // 10. Server-side pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const totalItems = displayList.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = displayList.slice(startIndex, startIndex + limit);

    // Global stats computed strictly from real eligible user records
    const totalCompletedAcrossPlatform = rankedUsers.reduce((sum, u) => sum + u.completedCount, 0);
    const topPoints = rankedUsers.length > 0 ? rankedUsers[0].points : 0;

    res.status(200).json({
      success: true,
      data: {
        leaderboard: paginatedUsers,
        currentUser,
        stats: {
          totalUsers: users.length,
          totalCompletedAcrossPlatform,
          topPoints,
          totalQuestions: totalDsaCount
        },
        pagination: {
          page,
          limit,
          totalPages,
          totalItems
        },
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};
