const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { getPlatformFromUrl } = require('../utils/languageUtils');

const DIFFICULTY_ORDER = { Easy: 1, Medium: 2, Hard: 3 };

exports.getAllQuestions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 200,
      topic,
      category,
      difficulty,
      status,
      search,
      source,
      sortBy = 'number',
      sortOrder = 'asc'
    } = req.query;

    const query = { questionType: 'DSA' };

    if (topic && topic !== 'All') query.topic = topic;
    if (category && category !== 'All') query.category = category;
    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;

    if (source && source !== 'All') {
      const field = `${source.toLowerCase()}Match`;
      if (['striverMatch', 'neetcodeMatch', 'leetcodeMatch', 'gfgMatch'].includes(field)) {
        query[field] = { $regex: /match/i };
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      const numTerm = parseInt(term, 10);
      const orConditions = [
        { title: { $regex: term, $options: 'i' } },
        { topic: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
        { pattern: { $regex: term, $options: 'i' } },
        { stableId: { $regex: term, $options: 'i' } }
      ];
      if (!isNaN(numTerm)) orConditions.push({ questionNumber: numTerm });
      query.$or = orConditions;
    }

    const [questionsRaw, allUserProgress] = await Promise.all([
      Question.find(query).lean(),
      UserQuestionProgress.find({ userId: req.user._id }).lean()
    ]);

    const progressMap = new Map();
    allUserProgress.forEach(p => {
      if (!progressMap.has(p.questionId) || p.status === 'Completed' || p.status === 'Solved') {
        progressMap.set(p.questionId, p);
      }
    });

    let questions = questionsRaw.map(q => {
      const p = progressMap.get(q.questionId) || progressMap.get(q.stableId);
      return {
        ...q,
        platform: q.platform || getPlatformFromUrl(q.practiceUrl) || (q.practiceUrl ? 'External Platform' : null),
        status: p ? p.status : 'Not Started',
        bookmarked: p ? p.bookmarked : false,
        isImportant: p ? p.isImportant : false,
        attempts: p ? p.attempts : 0,
        lastAttemptedAt: p ? p.lastAttemptedAt : null,
        nextRevisionAt: p ? p.nextRevisionAt : null,
        notes: p ? p.notes : '',
        solvedAt: p ? p.solvedAt : null
      };
    });

    if (status && status !== 'All') {
      const isComp = status === 'Completed' || status === 'Solved';
      questions = questions.filter(q =>
        isComp ? (q.status === 'Completed' || q.status === 'Solved') : q.status === status
      );
    }

    questions.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortBy === 'difficulty') {
        valA = DIFFICULTY_ORDER[a.difficulty] || 0;
        valB = DIFFICULTY_ORDER[b.difficulty] || 0;
      } else if (sortBy === 'status') {
        valA = a.status;
        valB = b.status;
      } else if (sortBy === 'lastAttempted') {
        valA = a.lastAttemptedAt ? new Date(a.lastAttemptedAt).getTime() : 0;
        valB = b.lastAttemptedAt ? new Date(b.lastAttemptedAt).getTime() : 0;
      } else if (sortBy === 'nextRevision') {
        valA = a.nextRevisionAt ? new Date(a.nextRevisionAt).getTime() : Infinity;
        valB = b.nextRevisionAt ? new Date(b.nextRevisionAt).getTime() : Infinity;
      } else {
        valA = a.questionNumber;
        valB = b.questionNumber;
      }

      if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
      if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    const totalCount = questions.length;
    const numLimit = parseInt(limit, 10);
    const numPage = parseInt(page, 10);
    const paginated = (limit !== 'all' && !isNaN(numLimit) && numLimit > 0)
      ? questions.slice((numPage - 1) * numLimit, numPage * numLimit)
      : questions;

    res.status(200).json({
      success: true,
      totalCount,
      count: paginated.length,
      page: numPage,
      totalPages: limit === 'all' ? 1 : Math.ceil(totalCount / numLimit),
      data: paginated
    });
  } catch (err) {
    next(err);
  }
};

exports.getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isNum = !isNaN(parseInt(id, 10)) && !id.startsWith('DSA-');
    const question = isNum
      ? await Question.findOne({ questionNumber: parseInt(id, 10) }).lean()
      : await Question.findOne({ $or: [{ questionId: id }, { stableId: id }] }).lean();

    if (!question) {
      return res.status(404).json({ success: false, message: `Question '${id}' not found.` });
    }

    const p = await UserQuestionProgress.findOne({
      userId: req.user._id,
      questionId: question.questionId
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...question,
        platform: question.platform || getPlatformFromUrl(question.practiceUrl) || (question.practiceUrl ? 'External Platform' : null),
        userProgress: p || {
          status: 'Not Started',
          attempts: 0,
          bookmarked: false,
          isImportant: false,
          notes: '',
          revisionHistory: []
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePracticeUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { practiceUrl } = req.body;

    const question = await Question.findOne({ $or: [{ questionId: id }, { stableId: id }] });
    if (!question) {
      return res.status(404).json({ success: false, message: `Question '${id}' not found.` });
    }

    question.practiceUrl = practiceUrl || '';
    question.platform = getPlatformFromUrl(practiceUrl) || 'External Platform';
    await question.save();

    res.status(200).json({
      success: true,
      message: 'Practice link updated successfully.',
      data: question
    });
  } catch (err) {
    next(err);
  }
};
