import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Check,
  Globe,
  Edit2,
  X,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import api from '../api/client';
import DifficultyBadge from '../components/common/DifficultyBadge';
import StatusBadge from '../components/common/StatusBadge';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Not Started');
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);

  // Inline practice URL editing
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customPracticeUrl, setCustomPracticeUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/questions/${id}`);
      if (res.data.success) {
        const q = res.data.data;
        setQuestion(q);
        setCustomPracticeUrl(q.practiceUrl || '');
        const p = q.userProgress || {};
        setStatus(p.status || 'Not Started');
      }
    } catch (err) {
      console.error('Failed to load question detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setIsSaving(true);
      const res = await api.put(`/progress/${question.questionId}`, {
        status: newStatus
      });
      if (res.data.success) {
        setStatus(newStatus);
        setQuestion(prev => ({
          ...prev,
          userProgress: {
            ...prev?.userProgress,
            ...res.data.data
          }
        }));
        setSaveNotice(`Status updated to "${newStatus}" & saved to MongoDB.`);
        setTimeout(() => setSaveNotice(null), 3500);
      }
    } catch (err) {
      alert(`Failed to save status: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePracticeUrl = async (e) => {
    e.preventDefault();
    if (!customPracticeUrl.trim()) return;
    try {
      setSavingUrl(true);
      const res = await api.put(`/questions/${question.questionId}/practice-url`, {
        practiceUrl: customPracticeUrl.trim()
      });
      if (res.data.success) {
        setQuestion(prev => ({
          ...prev,
          practiceUrl: res.data.data.practiceUrl,
          platform: res.data.data.platform
        }));
        setIsEditingUrl(false);
        setSaveNotice('Practice URL updated successfully.');
        setTimeout(() => setSaveNotice(null), 3000);
      }
    } catch (err) {
      alert(`Failed to update practice link: ${err.message}`);
    } finally {
      setSavingUrl(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-8 text-center bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-800">
        <p className="text-gray-500 font-medium">Question not found.</p>
        <button
          onClick={() => navigate('/questions')}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
        >
          Back to DSA Questions
        </button>
      </div>
    );
  }

  const isCompleted = status === 'Completed' || status === 'Solved';

  // Determine external platform name and action label
  const practiceUrl = question.practiceUrl;
  let platformLabel = 'External Platform';
  let platformAction = 'Solve Problem Externally';
  if (practiceUrl) {
    const u = practiceUrl.toLowerCase();
    if (u.includes('leetcode.com')) {
      platformLabel = 'LeetCode';
      platformAction = 'Solve on LeetCode';
    } else if (u.includes('geeksforgeeks.org')) {
      platformLabel = 'GeeksforGeeks';
      platformAction = 'Solve on GeeksforGeeks';
    } else if (u.includes('hackerrank.com')) {
      platformLabel = 'HackerRank';
      platformAction = 'Solve on HackerRank';
    } else if (u.includes('codeforces.com')) {
      platformLabel = 'Codeforces';
      platformAction = 'Solve on Codeforces';
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notice */}
      {saveNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/questions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to DSA Questions</span>
        </Link>

        <span className="text-xs font-mono text-gray-400">
          Question #{question.questionNumber} of 180
        </span>
      </div>

      {/* Main Question Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        {/* Badges & Title */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-gray-300">
              {question.stableId || `#${question.questionNumber}`}
            </span>
            <DifficultyBadge difficulty={question.difficulty} />
            <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/60">
              {question.topic}
            </span>
            {question.pattern && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800/60">
                {question.pattern}
              </span>
            )}
            <StatusBadge status={status} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {question.title}
          </h1>

          {/* Short description / prompt */}
          {question.prompt ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pt-1">
              {question.prompt}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic pt-1">
              Practice this question on its authoritative external platform, then track your placement readiness here.
            </p>
          )}
        </div>

        {/* Primary Action Row */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* External Practice Link */}
          <div>
            {practiceUrl ? (
              <a
                href={practiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02]"
              >
                <Globe className="w-4 h-4" />
                <span>{platformAction}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg font-medium">
                  Practice link not specified
                </span>
                <button
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  title="Add practice link"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Status Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Completion Button */}
            <button
              onClick={() => handleUpdateStatus(isCompleted ? 'Not Started' : 'Completed')}
              disabled={isSaving}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-gray-100 hover:bg-emerald-600 hover:text-white dark:bg-dark-700 dark:hover:bg-emerald-600 text-gray-800 dark:text-gray-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Completed' : 'Mark as Completed'}</span>
            </button>

            {/* Status Dropdown */}
            <select
              value={status}
              disabled={isSaving}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="text-xs py-2.5 px-3 rounded-xl font-semibold border outline-none bg-white dark:bg-dark-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer shadow-xs focus:border-indigo-500"
            >
              <option value="Not Started">Not Started</option>
              <option value="Attempted">Attempted</option>
              <option value="Completed">Completed</option>
              <option value="Needs Revision">Needs Revision</option>
              <option value="Revisit Later">Revisit Later</option>
            </select>
          </div>
        </div>

        {/* Inline URL Editing Form */}
        {isEditingUrl && (
          <form onSubmit={handleSavePracticeUrl} className="p-3.5 rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 shrink-0">Practice URL:</span>
            <input
              type="url"
              required
              value={customPracticeUrl}
              onChange={(e) => setCustomPracticeUrl(e.target.value)}
              placeholder="https://leetcode.com/problems/... or https://geeksforgeeks.org/..."
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={savingUrl}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {savingUrl ? 'Saving...' : 'Save URL'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingUrl(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Source Audit & Alignment Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>Curated Sheet Alignment</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {question.striverMatch && question.striverMatch !== 'Not confirmed' && (
            <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40">
              Striver: {question.striverMatch}
            </span>
          )}
          {question.neetcodeMatch && question.neetcodeMatch !== 'Not confirmed' && (
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
              NeetCode: {question.neetcodeMatch}
            </span>
          )}
          {question.leetcodeMatch && question.leetcodeMatch !== 'Not confirmed' && (
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
              LeetCode 150: {question.leetcodeMatch}
            </span>
          )}
          {question.gfgMatch && question.gfgMatch !== 'Not confirmed' && (
            <span className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-900/40">
              GFG: {question.gfgMatch}
            </span>
          )}
          {question.matchedSheets && (
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40 font-medium">
              Sheet: {question.matchedSheets}
            </span>
          )}
        </div>

        {question.matchNotes && (
          <p className="text-gray-500 dark:text-gray-400 text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Notes: </span>
            {question.matchNotes}
          </p>
        )}
      </div>

      {/* Return to List Link */}
      <div className="text-center pt-2">
        <Link
          to="/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Questions List</span>
        </Link>
      </div>
    </div>
  );
};

export default QuestionDetail;
