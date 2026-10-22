import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Circle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  History,
  X,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import DifficultyBadge from '../components/common/DifficultyBadge';
import StatusBadge from '../components/common/StatusBadge';

const TodaysPlan = () => {
  const { refreshPlanSummary } = useOutletContext() || {};
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replacingQuestionId, setReplacingQuestionId] = useState(null);
  const [allQuestionsList, setAllQuestionsList] = useState([]);
  const [replaceSearch, setReplaceSearch] = useState('');

  // Configure Daily Target Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTarget, setConfigTarget] = useState(5);
  const [configLoading, setConfigLoading] = useState(false);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plan/today');
      if (res.data.success) {
        setPlan(res.data.data);
        if (refreshPlanSummary) refreshPlanSummary();
      }

      // Also fetch missed questions from past dates
      const missedRes = await api.get('/plan/missed');
      if (missedRes.data.success) {
        setMissedQuestions(missedRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // Mark plan question status
  const handleItemStatusChange = async (questionId, newStatus) => {
    try {
      await api.put('/plan/item-status', {
        date: plan.date,
        questionId,
        status: newStatus
      });

      fetchPlan();

      const isCompleted = newStatus === 'Completed' || newStatus === 'Solved';
      if (isCompleted) {
        const nextCount = (plan.summary.completedCount || 0) + 1;
        if (nextCount >= plan.target) {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      alert(`Error updating question: ${err.message}`);
    }
  };

  // Reorder questions
  const handleMove = async (index, direction) => {
    if (!plan?.questions) return;
    const newItems = [...plan.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orderedIds = newItems.map(q => q.questionId);

    try {
      setPlan(prev => ({ ...prev, questions: newItems }));
      await api.put('/plan/reorder', {
        date: plan.date,
        orderedQuestionIds: orderedIds
      });
    } catch (err) {
      alert(`Reorder failed: ${err.message}`);
      fetchPlan();
    }
  };

  // Open replace modal
  const handleOpenReplace = async (qId) => {
    setReplacingQuestionId(qId);
    setShowReplaceModal(true);
    setReplaceSearch('');
    try {
      const res = await api.get('/questions?limit=all&type=all');
      if (res.data.success) {
        setAllQuestionsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load questions list for replacement:', err);
    }
  };

  // Confirm replacement
  const handleConfirmReplace = async (newQId) => {
    try {
      await api.put('/plan/replace', {
        date: plan.date,
        oldQuestionId: replacingQuestionId,
        newQuestionId: newQId
      });
      setShowReplaceModal(false);
      setReplacingQuestionId(null);
      fetchPlan();
    } catch (err) {
      alert(`Replacement failed: ${err.message}`);
    }
  };

  // Handle Daily Target Update & Plan Regeneration
  const handleApplyConfig = async () => {
    try {
      setConfigLoading(true);
      await api.post('/plan/customize', {
        date: plan?.date,
        target: configTarget
      });
      setShowConfigModal(false);
      fetchPlan();
    } catch (err) {
      alert(`Failed to update daily plan target: ${err.message}`);
    } finally {
      setConfigLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedCount = plan?.summary?.completedCount || 0;
  const target = plan?.target || 5;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header card with progress dial */}
      <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Today's Daily Target
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
              {plan?.date}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Configurable placement practice target. Progress is saved permanently per date.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowConfigModal(true);
              setConfigTarget(target);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-indigo-400 transition-colors"
            title="Configure daily DSA question target"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Daily Target</span>
          </button>

          <div className="text-right">
            <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {completedCount}/{target}
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Daily Solved Goal</p>
          </div>

          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center border-2 border-indigo-500/30 shrink-0">
            <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {Math.round((completedCount / target) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
            Selected Questions ({plan?.questions?.length || 0})
          </h3>
          <span className="text-xs text-gray-500">
            Target: {target} questions/day
          </span>
        </div>

        {plan?.questions?.map((item, index) => {
          const isSolved = item.status === 'Completed' || item.status === 'Solved';

          return (
            <div
              key={item.questionId}
              className={`p-4 rounded-xl border transition-all ${
                isSolved
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/40 shadow-xs'
                  : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Order & Reorder arrows */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold text-gray-500">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === plan.questions.length - 1}
                      className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Problem Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">
                        #{item.questionNumber}
                      </span>

                      <Link
                        to={`/questions/${item.questionId}`}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {item.title}
                      </Link>
                      <DifficultyBadge difficulty={item.difficulty} size="xs" />
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.topic}
                    </p>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.practiceUrl ? (
                    <a
                      href={item.practiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold transition-colors"
                      title="Solve on external platform (new tab)"
                    >
                      <span>Solve on {item.platform === 'LeetCode' ? 'LeetCode' : item.platform === 'GeeksforGeeks' ? 'GFG' : 'Platform'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      to={`/questions/${item.questionId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200"
                    >
                      <span>Details</span>
                    </Link>
                  )}

                  <button
                    onClick={() => handleItemStatusChange(item.questionId, isSolved ? 'Not Started' : 'Completed')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSolved
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-dark-700 hover:bg-emerald-600 hover:text-white text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSolved ? 'Completed' : 'Mark Done'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenReplace(item.questionId)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                    title="Swap with Another Question"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Missed questions section */}
      {missedQuestions.length > 0 && (
        <div className="mt-8 p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Missed From Past Plans ({missedQuestions.length})</span>
          </div>
          <div className="space-y-2">
            {missedQuestions.map((m) => (
              <div
                key={m.questionId}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-dark-800 border border-amber-200/60 dark:border-amber-800/30 text-xs"
              >
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {m.questionId.startsWith('LP-') ? m.questionId : `#${m.questionNumber}`} {m.title}
                  </span>
                  <span className="text-gray-400 ml-2">from {m.planDate}</span>
                </div>
                <Link
                  to={`/questions/${m.questionId}`}
                  className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium hover:underline text-[11px]"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configure Daily Target Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Configure Daily DSA Target
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Set your preferred daily DSA question target (default is 5 questions per day).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Daily Questions Target
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={configTarget}
                  onChange={(e) => setConfigTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full p-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 outline-none font-mono focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <span>Selected Questions Target:</span>
                <span className="font-mono font-bold text-sm">{configTarget}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-1.5 text-xs rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyConfig}
                disabled={configLoading || configTarget < 1}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                {configLoading ? 'Regenerating...' : 'Save & Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-dark-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Swap Question in Today's Plan
              </h3>
              <button
                onClick={() => setShowReplaceModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search replacement question by title, #, or topic..."
              value={replaceSearch}
              onChange={(e) => setReplaceSearch(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 outline-none"
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-gray-100 dark:divide-gray-800">
              {allQuestionsList
                .filter(q =>
                  !plan.questions.some(item => item.questionId === q.questionId || item.questionId === q.stableId) &&
                  (q.title.toLowerCase().includes(replaceSearch.toLowerCase()) ||
                    String(q.questionNumber).includes(replaceSearch) ||
                    (q.topic && q.topic.toLowerCase().includes(replaceSearch.toLowerCase())))
                )
                .slice(0, 20)
                .map((q) => (
                  <div
                    key={q.questionId}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg cursor-pointer text-xs"
                    onClick={() => handleConfirmReplace(q.stableId || q.questionId)}
                  >
                    <div>
                      <span className="font-mono text-gray-400 mr-2">
                        {q.stableId || `#${q.questionNumber}`}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {q.title}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-2">({q.topic || q.category})</span>
                    </div>
                    <DifficultyBadge difficulty={q.difficulty} size="xs" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaysPlan;
