import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Circle,
  Flame,
  Target,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../api/client';
import DifficultyBadge from '../components/common/DifficultyBadge';
import StatusBadge from '../components/common/StatusBadge';

const Dashboard = () => {
  const { refreshPlanSummary } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/summary');
      if (res.data.success) {
        setData(res.data.data);
        if (refreshPlanSummary) refreshPlanSummary();

        // Trigger confetti if today's 5/5 target reached
        if (res.data.data.todayCompletedCount >= res.data.data.todayTarget && res.data.data.todayTarget > 0) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading placement dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300">
        <p className="font-semibold">Unable to load dashboard data</p>
        <p className="text-sm mt-1">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    totalQuestions,
    solvedCount,
    attemptedCount,
    notStartedCount,
    completionPercentage,
    difficultyStats,
    topicStats,
    todayTarget,
    todayCompletedCount,
    currentStreak,
    longestStreak,
    dueRevisionsCount,
    weeklySolving,
    topicsNeedingImprovement,
    recentActivity
  } = data;

  const difficultyColors = {
    Easy: '#10B981',
    Medium: '#F59E0B',
    Hard: '#F43F5E'
  };

  const diffPieData = [
    { name: 'Easy', value: difficultyStats.Easy.solved, total: difficultyStats.Easy.total, color: '#10B981' },
    { name: 'Medium', value: difficultyStats.Medium.solved, total: difficultyStats.Medium.total, color: '#F59E0B' },
    { name: 'Hard', value: difficultyStats.Hard.solved, total: difficultyStats.Hard.total, color: '#F43F5E' }
  ];

  const isTodayGoalMet = todayCompletedCount >= todayTarget && todayTarget > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's 5 Target Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg border border-indigo-800/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Target className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-base">Today's Target</h3>
                <p className="text-xs text-indigo-200">Placement Daily Goal</p>
              </div>
            </div>
            <span className="text-2xl font-black font-mono text-indigo-300">
              {todayCompletedCount}/{todayTarget}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-indigo-950 rounded-full h-2.5 mb-3 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isTodayGoalMet ? 'bg-emerald-400' : 'bg-indigo-400'
              }`}
              style={{ width: `${Math.min(100, (todayCompletedCount / todayTarget) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-indigo-200">
            <span>{isTodayGoalMet ? '🎉 Daily goal achieved!' : `${todayTarget - todayCompletedCount} more to hit today's goal`}</span>
            <Link
              to="/today"
              className="inline-flex items-center gap-1 font-semibold text-white hover:text-indigo-200 transition-colors"
            >
              Solve Plan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Streak & Consistency Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              </span>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Daily Streak</h3>
                <p className="text-xs text-gray-500">Continuous problem solving</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
                {currentStreak} <span className="text-xs font-normal text-gray-500">days</span>
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500">
            <span>Longest Streak: <strong className="text-gray-900 dark:text-gray-100 font-mono">{longestStreak} days</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Keep momentum alive</span>
          </div>
        </div>

        {/* Spaced Revision Alert Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <RotateCcw className="w-5 h-5 text-purple-500" />
              </span>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Spaced Revision</h3>
                <p className="text-xs text-gray-500">Retention & intervals</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                {dueRevisionsCount}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500">
            <span>{dueRevisionsCount > 0 ? `${dueRevisionsCount} problems due for review` : 'All revisions up to date'}</span>
            <Link
              to="/revision"
              className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Review Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main KPI Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span>Total Curated Questions</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-gray-100 font-mono">
            {totalQuestions}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Placement Master Workbook</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span>Solved Questions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {solvedCount}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span>{completionPercentage}% complete</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span>Attempted / Unsolved</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
            {attemptedCount}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">In progress</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
            <span>Not Started</span>
            <Circle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-gray-600 dark:text-gray-300 font-mono">
            {notStartedCount}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Remaining to explore</p>
        </div>
      </div>

      {/* Charts Section: Weekly Activity & Difficulty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Solved Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Weekly Problem Solving Velocity</h4>
              <p className="text-xs text-gray-500">Solved questions over the last 7 days</p>
            </div>
            <span className="text-xs font-mono text-gray-400">Target: {todayTarget}/day</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySolving}>
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value} questions solved`, 'Solved']}
                />
                <Bar dataKey="solved" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">Difficulty Breakdown</h4>
            <p className="text-xs text-gray-500 mb-4">Solved versus total per tier</p>

            <div className="space-y-4">
              {['Easy', 'Medium', 'Hard'].map((diff) => {
                const stat = difficultyStats[diff] || { solved: 0, total: 0 };
                const pct = stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0;
                return (
                  <div key={diff}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <DifficultyBadge difficulty={diff} size="xs" />
                      <span className="font-mono text-gray-600 dark:text-gray-400">
                        <strong>{stat.solved}</strong> / {stat.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: difficultyColors[diff]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700/60 mt-4 text-xs text-gray-500 flex justify-between items-center">
            <span>Curated distribution</span>
            <Link to="/questions" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              View All 180 →
            </Link>
          </div>
        </div>
      </div>

      {/* Topic Mastery & Topics Needing Improvement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic-wise Completion */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Topic-Wise Syllabus Coverage</h4>
              <p className="text-xs text-gray-500">Real progress across all 14 placement modules</p>
            </div>
            <Link to="/questions" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Browse Topics
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {Object.entries(topicStats).map(([topic, stat]) => {
              const pct = stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0;
              return (
                <div key={topic} className="p-2.5 rounded-lg bg-gray-50 dark:bg-dark-700/40 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{topic}</span>
                    <span className="font-mono text-gray-500 shrink-0">{stat.solved}/{stat.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topics Needing Attention & Recent Activity */}
        <div className="space-y-6">
          {/* Topics Needing Improvement */}
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Focus Areas
            </h4>
            <p className="text-xs text-gray-500 mb-3">Topics with lowest completion</p>

            {topicsNeedingImprovement.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No critical weak spots detected yet.</p>
            ) : (
              <div className="space-y-2">
                {topicsNeedingImprovement.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{t.topic}</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 shrink-0 font-semibold">
                      {t.completionRate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Code Activity */}
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">Recent Activity</h4>
            <p className="text-xs text-gray-500 mb-3">Latest progress & updates</p>

            {recentActivity.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                <p>No recent activity recorded.</p>
                <Link to="/today" className="mt-2 inline-block text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Start today's first question →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 4).map((act) => (
                  <Link
                    key={act.id}
                    to={`/questions/${act.questionId}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700/60 border border-gray-100 dark:border-gray-800 text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{act.title}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300">
                      {act.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
