import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  RotateCcw,
  Layers,
  Flame,
  Clock,
  BookOpen
} from 'lucide-react';
import api from '../api/client';
import DifficultyBadge from '../components/common/DifficultyBadge';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/summary');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const {
    totalQuestions = 180,
    solvedCount = 0,
    attemptedCount = 0,
    needsRevisionCount = 0,
    remainingCount = 180,
    completionPercentage = 0,
    difficultyStats = { Easy: { total: 0, solved: 0 }, Medium: { total: 0, solved: 0 }, Hard: { total: 0, solved: 0 } },
    topicStats = {},
    weeklySolving = [],
    currentStreak = 0,
    longestStreak = 0,
    dueRevisionsCount = 0
  } = data;

  const diffChartData = [
    { name: 'Easy', Solved: difficultyStats.Easy?.solved || 0, Remaining: Math.max(0, (difficultyStats.Easy?.total || 0) - (difficultyStats.Easy?.solved || 0)) },
    { name: 'Medium', Solved: difficultyStats.Medium?.solved || 0, Remaining: Math.max(0, (difficultyStats.Medium?.total || 0) - (difficultyStats.Medium?.solved || 0)) },
    { name: 'Hard', Solved: difficultyStats.Hard?.solved || 0, Remaining: Math.max(0, (difficultyStats.Hard?.total || 0) - (difficultyStats.Hard?.solved || 0)) }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <span>DSA Placement Analytics</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Comprehensive metrics calculated strictly from your 180 DSA placement questions and revision progress.
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Solved */}
        <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Completed Questions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {solvedCount}/{totalQuestions}
            </span>
            <span className="text-xs font-semibold text-gray-400">({completionPercentage}%)</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-dark-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Remaining to Solve */}
        <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Remaining to Solve</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {remainingCount}
            </span>
            <span className="text-xs font-semibold text-gray-400">of 180</span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-2">Questions awaiting mastery</span>
        </div>

        {/* Active Streak */}
        <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Daily Streak</span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-orange-500">
              {currentStreak}
            </span>
            <span className="text-xs text-gray-400 font-medium">days (max: {longestStreak}d)</span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-2">Consistent practice habit</span>
        </div>

        {/* Due Revisions */}
        <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Revision Queue Due</span>
            <RotateCcw className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {dueRevisionsCount}
            </span>
            <span className="text-xs text-gray-400 font-medium">due today</span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-2">Spaced repetition intervals</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Breakdown Chart */}
        <div className="p-5 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
              Difficulty Distribution (180 DSA Questions)
            </h3>
            <span className="text-xs text-gray-400 font-mono">Easy / Medium / Hard</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diffChartData}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC'
                  }}
                />
                <Legend />
                <Bar dataKey="Solved" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Remaining" fill="#CBD5E1" opacity={0.3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Solved Chart */}
        <div className="p-5 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
              Daily Solving Velocity (Last 7 Days)
            </h3>
            <span className="text-xs text-gray-400 font-mono">Past Week Activity</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySolving}>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC'
                  }}
                />
                <Bar dataKey="solved" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Topic Breakdown Section */}
      <div className="p-5 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Topic-Wise Mastery (14 Core Placement Topics)</span>
            </h3>
            <p className="text-xs text-gray-500">Progress across canonical placement problem categories</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Object.entries(topicStats).map(([topic, stat]) => {
            const pct = stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0;
            return (
              <div key={topic} className="p-3.5 rounded-lg bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate pr-2">
                    {topic}
                  </span>
                  <span className="font-mono text-gray-500 shrink-0 font-medium">
                    {stat.solved}/{stat.total} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
