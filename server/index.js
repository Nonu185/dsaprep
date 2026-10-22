const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const Question = require('./models/Question');
const seedQuestions = require('./scripts/seedQuestions');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const planRoutes = require('./routes/planRoutes');
const revisionRoutes = require('./routes/revisionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const importExportRoutes = require('./routes/importExportRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Security & Parsing Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// CORS configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    appName: 'DSA Placement OS API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/revision', revisionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/data', importExportRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start server
let server;
const startServer = async () => {
  try {
    const dbInfo = await connectDB();

    // Auto-seed check: exactly 180 DSA questions
    const count = await Question.countDocuments();
    if (count !== 180) {
      console.log(`[Startup] Question count is ${count}/180. Executing dataset seed...`);
      await seedQuestions();
    } else {
      console.log(`[Startup] Question database verified with exactly 180 DSA questions.`);
    }

    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  DSA Placement OS Backend Server Running`);
      console.log(`  Port: ${PORT}`);
      console.log(`  Client Origin: ${allowedOrigin}`);
      console.log(`  Database Mode: ${dbInfo.isMemory ? 'Embedded Local Memory' : 'MongoDB Atlas'}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('[Startup Fatal Error]', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
