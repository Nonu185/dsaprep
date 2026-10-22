import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  AlertTriangle,
  Code2,
  Check,
  X,
  ExternalLink,
  Brain
} from 'lucide-react';
import api from '../api/client';
import DifficultyBadge from '../components/common/DifficultyBadge';

const RevisionQueue = () => {
  const [queue, setQueue] = useState({ overdue: [], dueToday: [], upcoming: [], totalInQueue: 0 });
  const [loading, setLoading] = useState(true);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [recalledIndependently, setRecalledIndependently] = useState(true);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [rescheduleDays, setRescheduleDays] = useState(1);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/revision/queue');
      if (res.data.success) {
        setQueue(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load revision queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenComplete = (item) => {
    setSelectedItem(item);
    setRecalledIndependently(true);
    setRevisionNotes('');
    setCompleteModalOpen(true);
  };

  const handleCompleteRevision = async () => {
    if (!selectedItem) return;
    try {
      await api.post('/revision/complete', {
        questionId: selectedItem.questionId,
        recalledIndependently,
        notes: revisionNotes
      });
      setCompleteModalOpen(false);
      fetchQueue();
    } catch (err) {
      alert(`Error completing revision: ${err.message}`);
    }
  };

  const handleReschedule = async (questionId, days) => {
    try {
      await api.post('/revision/reschedule', {
        questionId,
        daysFromNow: days
      });
      fetchQueue();
    } catch (err) {
      alert(`Error rescheduling: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { overdue, dueToday, upcoming, totalInQueue } = queue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <RotateCcw className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Spaced Repetition Queue
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">
              {dueToday.length + overdue.length} Actionable
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Scientifically scheduled reviews (1d, 3d, 7d, 14d, 30d) to ensure maximum retention for interview rounds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {totalInQueue}
            </div>
            <p className="text-[11px] text-gray-400">Total In Cycle</p>
          </div>
        </div>
      </div>

      {/* Overdue Queue */}
      {overdue.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Overdue Reviews ({overdue.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdue.map((item) => (
              <div
                key={item.questionId}
                className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-400">#{item.questionNumber}</span>
                      <Link to={`/questions/${item.questionId}`} className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-indigo-600">
                        {item.title}
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.topic} • Level {item.revisionLevel || 0}</p>
                  </div>
                  <DifficultyBadge difficulty={item.difficulty} size="xs" />
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    Due: {new Date(item.nextRevisionAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReschedule(item.questionId, 1)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-mono text-[11px]"
                    >
                      +1d
                    </button>
                    <button
                      onClick={() => handleOpenComplete(item)}
                      className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Today Queue */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-500" />
          Due for Review Today ({dueToday.length})
        </h3>

        {dueToday.length === 0 ? (
          <div className="p-8 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-gray-700 dark:text-gray-300">All caught up for today!</p>
            <p className="mt-1">No pending revision items scheduled for today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dueToday.map((item) => (
              <div
                key={item.questionId}
                className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-purple-200 dark:border-purple-900/40 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-400">#{item.questionNumber}</span>
                      <Link to={`/questions/${item.questionId}`} className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-indigo-600">
                        {item.title}
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.topic} • Cycle Level {item.revisionLevel || 0}</p>
                  </div>
                  <DifficultyBadge difficulty={item.difficulty} size="xs" />
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700/60">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">Scheduled Today</span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/questions/${item.questionId}`}
                      className="p-1 text-gray-400 hover:text-indigo-500"
                      title="View Question & External Practice Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleOpenComplete(item)}
                      className="px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Review Test
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Revisions */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-gray-400" />
          Upcoming Scheduled Revisions ({upcoming.length})
        </h3>

        {upcoming.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No future revisions in cycle yet. Solve problems to add them to the spaced repetition engine.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcoming.slice(0, 9).map((item) => (
              <div
                key={item.questionId}
                className="p-3.5 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-gray-400">#{item.questionNumber}</span>
                  <DifficultyBadge difficulty={item.difficulty} size="xs" />
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{item.title}</h4>
                <p className="text-[11px] text-gray-400">
                  Review on: <strong className="text-gray-600 dark:text-gray-300 font-mono">{new Date(item.nextRevisionAt).toLocaleDateString()}</strong>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Revision Modal */}
      {completeModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                Log Revision Assessment
              </h3>
              <button onClick={() => setCompleteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  #{selectedItem.questionNumber} {selectedItem.title}
                </p>
                <p className="text-gray-500">{selectedItem.topic}</p>
              </div>

              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Did you recall the optimal approach independently?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecalledIndependently(true)}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                      recalledIndependently
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Yes, Recalled Fully
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecalledIndependently(false)}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                      !recalledIndependently
                        ? 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Needed Hint / Solution
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Revision Note (optional)
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="What was tricky or easy to recall this time?"
                  rows="2"
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteRevision}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Confirm & Advance Level
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionQueue;
