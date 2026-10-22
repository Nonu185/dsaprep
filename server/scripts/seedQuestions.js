const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Question = require('../models/Question');
const { getPlatformFromUrl } = require('../utils/languageUtils');

const seedQuestions = async () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is not open. Seeding aborted to prevent silent failure.');
  }

  // 1. Seed DSA Questions (180 questions)
  const dsaSeedPath = path.join(__dirname, '..', 'data', 'questions_seed.json');
  if (!fs.existsSync(dsaSeedPath)) {
    throw new Error(`DSA seed file not found at ${dsaSeedPath}.`);
  }

  const rawDsa = fs.readFileSync(dsaSeedPath, 'utf-8');
  const dsaQuestions = JSON.parse(rawDsa);

  if (dsaQuestions.length !== 180) {
    throw new Error(`Expected exactly 180 DSA questions in seed file, found ${dsaQuestions.length}`);
  }

  for (const q of dsaQuestions) {
    const platform = getPlatformFromUrl(q.practiceUrl);
    await Question.findOneAndUpdate(
      { questionNumber: q.questionNumber },
      {
        $set: {
          questionId: q.questionId,
          stableId: q.questionId,
          questionNumber: q.questionNumber,
          questionType: 'DSA',
          title: q.title,
          topic: q.topic,
          difficulty: q.difficulty,
          pattern: q.pattern || '',
          practiceUrl: q.practiceUrl || '',
          platform: platform || 'LeetCode / GFG',
          originalStatus: q.originalStatus || '',
          matchedSheets: q.matchedSheets || '',
          linkSourceCheck: q.linkSourceCheck || '',
          striverMatch: q.striverMatch || '',
          neetcodeMatch: q.neetcodeMatch || '',
          leetcodeMatch: q.leetcodeMatch || '',
          gfgMatch: q.gfgMatch || '',
          matchNotes: q.matchNotes || ''
        },
        $unset: {
          starterCode: 1,
          testSuite: 1,
          testCases: 1
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Remove any obsolete Language Practice questions from the collection
  await Question.deleteMany({ questionType: 'LANGUAGE_PRACTICE' });

  // 2. Post-Seed Verification
  const dsaCount = await Question.countDocuments({ questionType: 'DSA' });
  const totalCount = await Question.countDocuments();

  console.log(`[Seed Report]`);
  console.log(`- DSA questions verified: ${dsaCount} (Expected: 180)`);
  console.log(`- Total inventory questions: ${totalCount} (Expected: 180)`);

  if (dsaCount !== 180) {
    throw new Error(`DSA inventory check failed! Expected 180 DSA questions, found ${dsaCount}`);
  }
  if (totalCount !== 180) {
    throw new Error(`Total inventory check failed! Expected 180 questions, found ${totalCount}`);
  }

  console.log(`[Seed Success] Exactly 180 DSA unique question records verified.`);
  return { success: true, dsaCount, totalCount };
};

// If run directly from CLI
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  (async () => {
    try {
      await connectDB();
      await seedQuestions();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]', err);
      process.exit(1);
    }
  })();
}

module.exports = seedQuestions;
