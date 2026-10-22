const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');

exports.exportTracker = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;

    const allQuestions = await Question.find().sort({ questionNumber: 1 }).lean();
    const userProgress = await UserQuestionProgress.find({ userId: req.user._id }).lean();
    const progressMap = new Map(userProgress.map(p => [p.questionId, p]));

    const rows = allQuestions.map(q => {
      const p = progressMap.get(q.questionId) || {};
      return {
        questionNumber: q.questionNumber,
        questionId: q.questionId,
        title: q.title,
        topic: q.topic,
        difficulty: q.difficulty,
        pattern: q.pattern || '',
        practiceUrl: q.practiceUrl,
        status: p.status || 'Not Started',
        attempts: p.attempts || 0,
        solvedAt: p.solvedAt ? new Date(p.solvedAt).toISOString() : '',
        bookmarked: p.bookmarked ? 'true' : 'false',
        isImportant: p.isImportant ? 'true' : 'false',
        notes: (p.notes || '').replace(/"/g, '""'),
        approach: (p.approach || '').replace(/"/g, '""'),
        timeComplexity: p.timeComplexity || '',
        spaceComplexity: p.spaceComplexity || '',
        mistakes: (p.mistakes || '').replace(/"/g, '""'),
        keyLearning: (p.keyLearning || '').replace(/"/g, '""')
      };
    });

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        exportDate: new Date().toISOString(),
        totalQuestions: rows.length,
        data: rows
      });
    }

    // Generate CSV
    const headers = [
      'Question Number',
      'Question ID',
      'Title',
      'Topic',
      'Difficulty',
      'Pattern',
      'Practice URL',
      'Status',
      'Attempts',
      'Solved At',
      'Bookmarked',
      'Important',
      'Notes',
      'Approach',
      'Time Complexity',
      'Space Complexity',
      'Mistakes',
      'Key Learning'
    ];

    const csvLines = [headers.join(',')];
    rows.forEach(r => {
      const line = [
        r.questionNumber,
        `"${r.questionId}"`,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.topic.replace(/"/g, '""')}"`,
        `"${r.difficulty}"`,
        `"${r.pattern.replace(/"/g, '""')}"`,
        `"${r.practiceUrl}"`,
        `"${r.status}"`,
        r.attempts,
        `"${r.solvedAt}"`,
        r.bookmarked,
        r.isImportant,
        `"${r.notes}"`,
        `"${r.approach}"`,
        `"${r.timeComplexity}"`,
        `"${r.spaceComplexity}"`,
        `"${r.mistakes}"`,
        `"${r.keyLearning}"`
      ];
      csvLines.push(line.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="DSA_Placement_OS_Progress.csv"');
    res.status(200).send(csvLines.join('\n'));
  } catch (err) {
    next(err);
  }
};

exports.previewImport = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of progress objects

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for import preview.'
      });
    }

    const validStatuses = ['Not Started', 'Attempted', 'Solved', 'Needs Revision', 'Revisit Later'];
    let validCount = 0;
    let invalidCount = 0;
    const errors = [];
    const previewList = [];

    items.forEach((item, index) => {
      const qNum = parseInt(item.questionNumber, 10);
      if (isNaN(qNum) || qNum < 1 || qNum > 180) {
        invalidCount++;
        errors.push(`Row ${index + 1}: Invalid question number '${item.questionNumber}'.`);
        return;
      }

      const status = item.status || 'Not Started';
      if (!validStatuses.includes(status)) {
        invalidCount++;
        errors.push(`Row ${index + 1}: Invalid status '${item.status}'.`);
        return;
      }

      validCount++;
      if (previewList.length < 10) {
        previewList.push({
          questionNumber: qNum,
          status,
          notes: (item.notes || '').slice(0, 50),
          bookmarked: Boolean(item.bookmarked)
        });
      }
    });

    res.status(200).json({
      success: true,
      totalReceived: items.length,
      validCount,
      invalidCount,
      errors: errors.slice(0, 10),
      previewSample: previewList
    });
  } catch (err) {
    next(err);
  }
};

exports.executeImport = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items to import.'
      });
    }

    let updated = 0;
    const validStatuses = ['Not Started', 'Attempted', 'Solved', 'Needs Revision', 'Revisit Later'];

    for (const item of items) {
      const qNum = parseInt(item.questionNumber, 10);
      if (isNaN(qNum) || qNum < 1 || qNum > 180) continue;

      const questionId = item.questionId || `DSA-180-${String(qNum).padStart(3, '0')}`;
      const status = validStatuses.includes(item.status) ? item.status : 'Not Started';

      await UserQuestionProgress.findOneAndUpdate(
        { userId: req.user._id, questionId },
        {
          $set: {
            questionNumber: qNum,
            status,
            bookmarked: Boolean(item.bookmarked),
            isImportant: Boolean(item.isImportant),
            notes: item.notes || '',
            approach: item.approach || '',
            timeComplexity: item.timeComplexity || '',
            spaceComplexity: item.spaceComplexity || '',
            mistakes: item.mistakes || '',
            keyLearning: item.keyLearning || '',
            lastAttemptedAt: new Date()
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      updated++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported progress for ${updated} questions.`,
      updatedCount: updated
    });
  } catch (err) {
    next(err);
  }
};
