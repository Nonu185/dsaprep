import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Search,
  RefreshCw,
  Sparkles,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

// Helper for initials
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'U';
};

// Deterministic gradient colors for initials avatars
const getAvatarBg = (name = '') => {
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-fuchsia-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Robust candidate avatar with automatic error fallback to initials
const CandidateAvatar = ({ src, name = '', size = 'w-10 h-10', textClass = 'text-xs' }) => {
  const [loadFailed, setLoadFailed] = useState(false);

  // Validate URL format and reject known placeholder / broken test strings
  const isValidUrl =
    src &&
    typeof src === 'string' &&
    src.startsWith('http') &&
    !src.includes('candidate_a_photo') &&
    !src.includes('student_avatar');

  if (isValidUrl && !loadFailed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setLoadFailed(true)}
        className={`${size} rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-bold text-white ${textClass} bg-gradient-to-tr ${getAvatarBg(
        name
      )} shadow-xs shrink-0 select-none`}
    >
      {getInitials(name)}
    </div>
  );
};

const Leaderboard = () => {
  const { user: authUser } = useAuth();
  const [data, setData] = useState({
    leaderboard: [],
    currentUser: null,
    stats: {
      totalUsers: 0,
      totalCompletedAcrossPlatform: 0,
      topPoints: 0,
      totalQuestions: 180
    },
    pagination: {
      page: 1,
      limit: 50,
      totalPages: 1,
      totalItems: 0
    },
    updatedAt: null
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const lastFetchRef = useRef(0);
  const isMountedRef = useRef(true);

  const fetchLeaderboard = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setRefreshing(true);

        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', 50);
        if (search.trim()) {
          params.append('search', search.trim());
        }

        const res = await api.get(`/leaderboard?${params.toString()}`);
        if (res.data.success && isMountedRef.current) {
          setData(res.data.data);
          setError(null);
          lastFetchRef.current = Date.now();
        }
      } catch (err) {
        if (isMountedRef.current && !isSilent) {
          setError(err.message || 'Failed to fetch leaderboard data.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, search]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchLeaderboard(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchLeaderboard]);

  // Polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  // Refresh when window or tab gains focus
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLast = Date.now() - lastFetchRef.current;
        if (timeSinceLast > 10000) {
          fetchLeaderboard(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [fetchLeaderboard]);

  const { leaderboard, currentUser, stats, pagination, updatedAt } = data;
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Trophy className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Live Leaderboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time placement preparation standings across all registered candidates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live (30s)
          </div>

          <button
            onClick={() => fetchLeaderboard(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors shadow-xs disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => fetchLeaderboard(false)}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Highlight Cards: Current User standing & Real Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current user card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Your Current Standing
            </span>
            {currentUser && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                Rank #{currentUser.rank}
              </span>
            )}
          </div>

          {currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CandidateAvatar src={currentUser.avatar} name={currentUser.name} size="w-10 h-10" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    {currentUser.name}
                    <span className="text-xs font-normal text-indigo-500 dark:text-indigo-400">(You)</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser.points.toLocaleString()} points earned
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <span>Solved {currentUser.completedCount} / 180 Questions</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {currentUser.completionPercentage}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, currentUser.completionPercentage)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Easy: {currentUser.breakdown?.easy || 0}
                </span>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Med: {currentUser.breakdown?.medium || 0}
                </span>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  Hard: {currentUser.breakdown?.hard || 0}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-4">
              Solve DSA problems from your master list to gain points and rank on the live leaderboard.
            </p>
          )}
        </div>

        {/* Real Registered Candidates Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Candidates</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Active candidates practicing across the curriculum
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-xs text-gray-500 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span>Master 180 DSA Questions</span>
          </div>
        </div>

        {/* Real Top Score / Solved Count */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Top Score</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-amber-500">
              {stats.topPoints.toLocaleString()} <span className="text-sm font-semibold text-gray-400">pts</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.totalCompletedAcrossPlatform} total questions solved globally
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-xs text-gray-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Deterministic real-time ranking</span>
          </div>
        </div>
      </div>

      {/* Podium for Available Top Candidates (1, 2, or 3 distinct users) */}
      {page === 1 && !search && topThree.length > 0 && !loading && (
        <div
          className={`grid gap-4 pt-2 ${
            topThree.length === 1
              ? 'grid-cols-1 max-w-sm mx-auto'
              : topThree.length === 2
              ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
              : 'grid-cols-1 sm:grid-cols-3'
          }`}
        >
          {topThree.map((user, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;

            const podiumConfig = isFirst
              ? {
                  title: '1st Place',
                  badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                  border: 'border-amber-400/50 shadow-amber-500/10',
                  icon: <Trophy className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                }
              : isSecond
              ? {
                  title: '2nd Place',
                  badgeBg: 'bg-slate-400/10 text-slate-400 border-slate-400/30',
                  border: 'border-slate-400/40 shadow-slate-500/5',
                  icon: <Medal className="w-5 h-5 text-slate-400" />
                }
              : {
                  title: '3rd Place',
                  badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                  border: 'border-orange-500/30 shadow-orange-500/5',
                  icon: <Medal className="w-5 h-5 text-orange-400" />
                };

            return (
              <div
                key={user.userId}
                className={`relative p-5 rounded-2xl bg-white dark:bg-dark-800 border ${podiumConfig.border} shadow-md flex flex-col items-center text-center transition-transform hover:-translate-y-0.5`}
              >
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${podiumConfig.badgeBg} mb-3`}
                >
                  {podiumConfig.icon}
                  {podiumConfig.title}
                </div>

                <div className="relative mb-3">
                  <CandidateAvatar src={user.avatar} name={user.name} size="w-16 h-16" textClass="text-base" />
                  {user.isCurrentUser && (
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                      You
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-full">
                  {user.name}
                </h3>
                <div className="text-xl font-extrabold text-amber-500 mt-1">
                  {user.points.toLocaleString()} <span className="text-xs font-semibold text-gray-400">pts</span>
                </div>

                <div className="w-full mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Solved {user.completedCount} / 180</span>
                    <span className="font-semibold text-indigo-500">{user.completionPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-dark-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${Math.min(100, user.completionPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Leaderboard Table Section */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
        {/* Table controls */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search candidate by name..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Showing {leaderboard.length} of {pagination.totalItems} candidates
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Loading live rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No candidates found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {search
                ? 'Try clearing your search term to see all candidates.'
                : 'Start solving DSA questions to appear on the leaderboard.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50/60 dark:bg-dark-900/40">
                  <th className="py-3.5 pl-6 pr-4 w-20 text-center">Rank</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 text-center">Solved</th>
                  <th className="py-3.5 px-4 w-48">Progress</th>
                  <th className="py-3.5 pl-4 pr-6 text-right hidden sm:table-cell">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                {leaderboard.map((user) => (
                  <tr
                    key={user.userId}
                    className={`transition-colors ${
                      user.isCurrentUser
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/20 font-medium'
                        : 'hover:bg-gray-50/70 dark:hover:bg-dark-700/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 pl-6 pr-4 text-center">
                      {user.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-500 font-bold">
                          🥇
                        </span>
                      ) : user.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-400 font-bold">
                          🥈
                        </span>
                      ) : user.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold">
                          🥉
                        </span>
                      ) : (
                        <span className="inline-block text-gray-500 dark:text-gray-400 font-semibold">
                          #{user.rank}
                        </span>
                      )}
                    </td>

                    {/* Candidate Avatar & Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <CandidateAvatar src={user.avatar} name={user.name} size="w-9 h-9" textClass="text-[11px]" />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-amber-500 dark:text-amber-400 text-sm">
                        {user.points.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-1">pts</span>
                    </td>

                    {/* Solved Count */}
                    <td className="py-4 px-4 text-center font-medium text-gray-700 dark:text-gray-300">
                      {user.completedCount} <span className="text-gray-400">/ 180</span>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                          <span>{user.completionPercentage}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, user.completionPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Breakdown Pills */}
                    <td className="py-4 pl-4 pr-6 text-right hidden sm:table-cell">
                      <div className="inline-flex items-center gap-1.5 text-[11px]">
                        <span
                          className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          title="Easy problems solved"
                        >
                          E: {user.breakdown?.easy || 0}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                          title="Medium problems solved"
                        >
                          M: {user.breakdown?.medium || 0}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold"
                          title="Hard problems solved"
                        >
                          H: {user.breakdown?.hard || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-40 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-40 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rules & Points System Footer */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-900/40 border border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            <strong>Points Formula:</strong> Easy = 10 pts, Medium = 20 pts, Hard = 30 pts. Deterministic tie-breaking by points, questions solved, and speed.
          </span>
        </div>
        {updatedAt && (
          <span className="text-[11px] text-gray-400 shrink-0">
            Last synced: {new Date(updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
