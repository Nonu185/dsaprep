import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Upload,
  ExternalLink,
  Bookmark,
  Star,
  CheckCircle2,
  Clock,
  Circle,
  AlertTriangle,
  ArrowUpDown,
  X,
  FileSpreadsheet,
  Globe,
  Check
} from 'lucide-react';
import api from '../api/client';
import DifficultyBadge from '../components/common/DifficultyBadge';
import StatusBadge from '../components/common/StatusBadge';
import TopicBadge from '../components/common/TopicBadge';

const AllQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [sortBy, setSortBy] = useState('number');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusNotice, setStatusNotice] = useState(null);

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: 'all',
        type: 'DSA',
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        status: selectedStatus,
        source: selectedSource,
        search,
        sortBy,
        sortOrder
      });

      const res = await api.get(`/questions?${params.toString()}`);
      if (res.data.success) {
        setQuestions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedTopic, selectedDifficulty, selectedStatus, selectedSource, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  // Quick status update from table
  const handleStatusChange = async (questionId, newStatus) => {
    try {
      const res = await api.put(`/progress/${questionId}`, {
        status: newStatus
      });
      if (res.data.success) {
        setQuestions(prev =>
          prev.map(q => (q.questionId === questionId ? { ...q, status: newStatus } : q))
        );
        setStatusNotice(`Status updated to "${newStatus}" and saved to MongoDB.`);
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = async (q) => {
    try {
      const nextState = !q.bookmarked;
      await api.put(`/progress/${q.questionId}`, { bookmarked: nextState });
      setQuestions(prev =>
        prev.map(item => (item.questionId === q.questionId ? { ...item, bookmarked: nextState } : item))
      );
    } catch (err) {
      alert(`Error updating bookmark: ${err.message}`);
    }
  };

  // Important toggle
  const handleToggleImportant = async (q) => {
    try {
      const nextState = !q.isImportant;
      await api.put(`/progress/${q.questionId}`, { isImportant: nextState });
      setQuestions(prev =>
        prev.map(item => (item.questionId === q.questionId ? { ...item, isImportant: nextState } : item))
      );
    } catch (err) {
      alert(`Error updating star: ${err.message}`);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    window.open('/api/data/export?format=csv', '_blank');
  };

  // Import JSON Parser & Preview
  const handlePreviewImport = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Import data must be a valid JSON array of question progress items.');
      }
      setImportPreview(parsed);
      setImportMsg(null);
    } catch (err) {
      setImportMsg({ type: 'error', text: `Invalid JSON: ${err.message}` });
      setImportPreview(null);
    }
  };

  // Commit Import
  const handleCommitImport = async () => {
    if (!importPreview) return;
    try {
      setImportLoading(true);
      const res = await api.post('/data/import', { progressItems: importPreview });
      if (res.data.success) {
        setImportMsg({
          type: 'success',
          text: `Successfully imported ${res.data.importedCount} questions! (Updated: ${res.data.modifiedCount})`
        });
        setTimeout(() => {
          setIsImportOpen(false);
          setImportPreview(null);
          setImportJsonText('');
          fetchQuestions();
        }, 1500);
      }
    } catch (err) {
      setImportMsg({ type: 'error', text: `Import failed: ${err.message}` });
    } finally {
      setImportLoading(false);
    }
  };

  const completedCount = questions.filter(q => q.status === 'Completed' || q.status === 'Solved').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusNotice && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-800/60">
              180 Curated Questions
            </span>
            <span className="text-xs text-gray-500 font-medium">Placement Preparation Master List</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>DSA Questions</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            180 curated placement questions. Solve on LeetCode or GeeksforGeeks, then mark them complete to track your mastery.
          </p>
        </div>

        {/* Action Buttons: Export / Import */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors shadow-2xs"
            title="Download CSV spreadsheet of entire 180 questions with your progress"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors shadow-2xs"
            title="Import questions progress JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Completion Progress: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{completedCount} / 180 Questions Completed</strong>
          </span>
          <span className="text-gray-500 font-mono font-semibold">{Math.round((completedCount / 180) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-dark-700 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedCount / 180) * 100)}%` }}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, topic, pattern, or problem number..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-indigo-500 transition-colors"
            />
          </form>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Topic dropdown */}
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="All">All Topics (14)</option>
              <option value="Arrays & Fundamentals">Arrays & Fundamentals</option>
              <option value="Strings & Hashing">Strings & Hashing</option>
              <option value="Two Pointers & Sliding Window">Two Pointers & Sliding Window</option>
              <option value="Binary Search">Binary Search</option>
              <option value="Linked Lists">Linked Lists</option>
              <option value="Stacks & Queues">Stacks & Queues</option>
              <option value="Binary Trees">Binary Trees</option>
              <option value="Binary Search Trees">Binary Search Trees</option>
              <option value="Heaps & Priority Queues">Heaps & Priority Queues</option>
              <option value="Recursion & Backtracking">Recursion & Backtracking</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
              <option value="Graphs">Graphs</option>
              <option value="Bit Manipulation & Math">Bit Manipulation & Math</option>
              <option value="Greedy & Intervals">Greedy & Intervals</option>
            </select>

            {/* Difficulty dropdown */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Status dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="Attempted">Attempted</option>
              <option value="Completed">Completed</option>
              <option value="Needs Revision">Needs Revision</option>
              <option value="Revisit Later">Revisit Later</option>
            </select>

            {/* Source dropdown */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="text-xs py-2 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="All">All Source Matches</option>
              <option value="striver">Striver Sheet Match</option>
              <option value="neetcode">NeetCode 150 Match</option>
              <option value="leetcode">LeetCode 150 Match</option>
              <option value="gfg">GFG Match</option>
            </select>

            {/* Sort order toggle */}
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
              title={`Sorting: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Questions Master Table */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 font-semibold tracking-wider uppercase text-[11px]">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-2 w-8 text-center">★</th>
                <th className="py-3 px-4">Problem Title</th>
                <th className="py-3 px-3">Topic & Pattern</th>
                <th className="py-3 px-3">Level</th>
                <th className="py-3 px-3">Solve Externally</th>
                <th className="py-3 px-3">Completion & Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading master questions...</span>
                    </div>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    No questions match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                questions.map((q) => {
                  const isDone = q.status === 'Completed' || q.status === 'Solved';

                  // Detect platform
                  let platformText = 'Platform';
                  if (q.practiceUrl) {
                    const u = q.practiceUrl.toLowerCase();
                    if (u.includes('leetcode.com')) platformText = 'LeetCode';
                    else if (u.includes('geeksforgeeks.org')) platformText = 'GFG';
                    else if (u.includes('hackerrank.com')) platformText = 'HackerRank';
                    else if (u.includes('codeforces.com')) platformText = 'Codeforces';
                  }

                  return (
                    <tr
                      key={q.questionId}
                      className="hover:bg-gray-50/80 dark:hover:bg-dark-700/40 transition-colors group"
                    >
                      {/* Number */}
                      <td className="py-3 px-3 font-mono font-semibold text-gray-500 text-center">
                        {q.questionNumber}
                      </td>

                      {/* Bookmark & Star */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleToggleImportant(q)}
                          className="text-gray-300 dark:text-gray-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors"
                          title={q.isImportant ? 'Unmark important' : 'Mark as high priority'}
                        >
                          <Star className={`w-3.5 h-3.5 ${q.isImportant ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Title & Notes Link */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to={`/questions/${q.questionId}`}
                            className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs"
                          >
                            {q.title}
                          </Link>
                          {q.matchedSheets && q.matchedSheets !== 'No exact title match found in supplied sheets' && (
                            <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                              {q.matchedSheets}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Topic & Pattern */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-800 dark:text-gray-200 font-medium">{q.topic}</span>
                          {q.pattern && (
                            <span className="text-[11px] text-gray-400 truncate max-w-[160px]">{q.pattern}</span>
                          )}
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="py-3 px-3">
                        <DifficultyBadge difficulty={q.difficulty} size="xs" />
                      </td>

                      {/* External Practice Link */}
                      <td className="py-3 px-3">
                        {q.practiceUrl ? (
                          <a
                            href={q.practiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors shadow-2xs group/btn"
                            title={`Solve ${q.title} on ${platformText} (new tab)`}
                          >
                            <Globe className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Solve on {platformText}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">
                            Practice link unavailable
                          </span>
                        )}
                      </td>

                      {/* Status Dropdown and Mark Completed Button */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(q.questionId, isDone ? 'Not Started' : 'Completed')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-gray-100 hover:bg-emerald-600 hover:text-white dark:bg-dark-700 dark:hover:bg-emerald-600 text-gray-700 dark:text-gray-300'
                            }`}
                            title={isDone ? 'Click to undo completion' : 'Click to mark as completed'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                          </button>

                          <select
                            value={q.status || 'Not Started'}
                            onChange={(e) => handleStatusChange(q.questionId, e.target.value)}
                            className="text-[11px] py-1 px-1.5 rounded-md font-medium border outline-none bg-white dark:bg-dark-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="Attempted">Attempted</option>
                            <option value="Completed">Completed</option>
                            <option value="Needs Revision">Needs Revision</option>
                            <option value="Revisit Later">Revisit Later</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleBookmark(q)}
                            className={`p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors ${
                              q.bookmarked ? 'text-indigo-600 dark:text-indigo-400' : ''
                            }`}
                            title={q.bookmarked ? 'Remove bookmark' : 'Bookmark question'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${q.bookmarked ? 'fill-indigo-600 text-indigo-600' : ''}`} />
                          </button>

                          <Link
                            to={`/questions/${q.questionId}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                            title="View Question Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500 hover:text-indigo-600" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-dark-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                Import Tracker Progress
              </h3>
              <button
                onClick={() => { setIsImportOpen(false); setImportPreview(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500">
                Paste JSON progress array exported from DSA Placement OS to restore your problem statuses, notes, and attempts safely.
              </p>

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='[{"questionNumber": 1, "status": "Completed", "notes": "Two pointer traversal"}]'
                rows="6"
                className="w-full p-3 font-mono text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-500"
              />

              {importMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${
                    importMsg.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {importMsg.text}
                </div>
              )}

              {importPreview && (
                <div className="p-3 bg-gray-50 dark:bg-dark-900 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    Validated: {importPreview.length} questions ready to sync.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handlePreviewImport}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700"
                >
                  Validate JSON
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={!importPreview || importLoading}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  {importLoading ? 'Importing...' : 'Commit Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllQuestions;
