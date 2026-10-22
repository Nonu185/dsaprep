# DSA Placement OS — 180 Problem Placement Preparation Tracker

A minimal, clean DSA placement preparation tracker engineered for technical interview preparation.

Master **180 curated, placement-focused DSA questions** with verified external practice links to **LeetCode** and **GeeksforGeeks**, a configurable daily target of **5 questions/day**, spaced repetition revision system, mock interview mode, live candidate leaderboard, and placement readiness analytics.

---

## 🌟 Key Features

1. **Curated Master 180 Questions**:
   - **Exactly 180 Placement-focused DSA Questions** extracted directly from `DSA_Placement_Master_180_Source_Matched.xlsx`.
   - Canonical problem titles, difficulty levels, 14 core syllabus topics, algorithmic patterns, and verified practice links.
   - Authoritative source-match cross-referencing: Striver A2Z, NeetCode 150, LeetCode Top Interview 150, and GFG SDE/160.

2. **External Practice Platform Links**:
   - Direct **Solve on LeetCode** and **Solve on GeeksforGeeks** actions for each question opening in new tabs with `rel="noopener noreferrer"`.
   - Automatic platform detection (LeetCode, GeeksforGeeks, HackerRank, Codeforces).
   - In-app URL editing and fallback handling.

3. **Live Leaderboard**:
   - Real-time candidate ranking based on actual DSA completion stored in MongoDB.
   - Consistent scoring formula: Easy = 10 pts, Medium = 20 pts, Hard = 30 pts.
   - Deterministic tie-breaking, podium highlights for top ranks, and current user standing.
   - Background polling every 30 seconds and automatic refresh on tab focus.

4. **Manual Completion Tracking**:
   - Dedicated **Mark as Completed** action on every question across tracker, today's plan, and question details.
   - Supported statuses: `Not Started`, `Attempted`, `Completed`, `Needs Revision`, `Revisit Later`.
   - Instant persistence to MongoDB with immediate UI confirmation.
   - Ability to undo completion or change status at any time.
   - Progress is 100% isolated per user account.

5. **Daily 5-Question Target Engine**:
   - Automatically schedules 5 unsolved problems in recommended learning order.
   - Configurable daily target (default 5 questions/day).
   - Prevents duplicate problems within the same date.
   - Tracks missed problems across past dates with quick rescheduling.
   - Celebratory completion animation when daily target is achieved.

6. **Spaced Repetition Revision Queue**:
   - Automated intervals: Day 1, Day 3, Day 7, Day 14, and Day 30.
   - Due Today, Overdue, and Upcoming queues.
   - Preserves revision scheduling and status transitions.

7. **Mock Technical Interview Mode**:
   - Timed coding assessment simulation (30m, 45m, 60m, 90m).
   - External problem links, timer with pause/resume, and scorecard summary.

8. **Full-Stack Security & Google OAuth Authentication**:
   - Google OAuth-only authentication with server-side token verification and JWT session cookies.
   - Helmet security headers, CORS origin verification, rate limiting.
   - Strict multi-tenant authorization: users can never access or modify another candidate's progress.

9. **Analytics & Progress Reports**:
   - Real metrics calculated strictly from the 180 DSA questions and user progress.
   - Weekly solving velocity chart (Recharts).
   - Topic mastery across all 14 placement modules.
   - Easy, Medium, and Hard difficulty distribution.
   - Active streak and longest consistency streak.

10. **Export & Import**:
    - One-click CSV and JSON data export.
    - Safe CSV/JSON progress import with syntax validation, row preview, and error reporting.

---

## 📂 Project Architecture

```
dsatracker/
├── DSA_Placement_Master_180_Source_Matched.xlsx   # Master workbook source of truth
├── package.json                                   # Root orchestration scripts
├── server/
│   ├── index.js                                   # Express server & security middleware
│   ├── config/
│   │   └── db.js                                  # MongoDB Atlas + embedded fallback
│   ├── models/
│   │   ├── User.js                                # Candidate account & preferences
│   │   ├── Question.js                            # 180 DSA questions metadata
│   │   ├── UserQuestionProgress.js                # Status & revision intervals
│   │   └── DailyPlan.js                           # Daily 5-question planner
│   ├── controllers/                               # REST API business logic
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── importExportController.js
│   │   ├── leaderboardController.js
│   │   ├── planController.js
│   │   ├── progressController.js
│   │   ├── questionController.js
│   │   └── revisionController.js
│   ├── routes/                                    # Express endpoints
│   ├── services/
│   │   └── revisionService.js                     # Spaced repetition scheduler
│   ├── scripts/
│   │   └── seedQuestions.js                       # Idempotent 180 question seeder
│   └── data/
│       └── questions_seed.json                    # Exact 180 DSA questions dataset
└── client/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── context/
        │   ├── AuthContext.jsx                    # User session state & Google OAuth
        │   └── ThemeContext.jsx                   # Dark/light mode switcher
        ├── pages/
        │   ├── Dashboard.jsx                      # Placement KPI summary
        │   ├── AllQuestions.jsx                   # 180 DSA tracker with external links
        │   ├── QuestionDetail.jsx                 # Problem details & manual status tracking
        │   ├── TodaysPlan.jsx                     # Daily 5-problem target
        │   ├── Leaderboard.jsx                    # Live candidate rankings
        │   ├── RevisionQueue.jsx                  # Spaced repetition intervals
        │   ├── MockInterview.jsx                  # Timed interview simulation
        │   ├── Analytics.jsx                      # Visual charts & readiness metrics
        │   └── Settings.jsx                       # Placement preferences
        └── components/
            ├── layout/                            # Responsive sidebar, topbar, command menu
            └── common/                            # Difficulty, status, topic badges
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local MongoDB
- Google OAuth Client ID and Secret

### Running Locally

```bash
# Install dependencies
npm run install:all

# Start backend server (port 5001)
cd server && npm run dev

# Start frontend application (port 5173)
cd client && npm run dev
```

### Production Build

```bash
# Build client production bundle
cd client && npm run build
```
