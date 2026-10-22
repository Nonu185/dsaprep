import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, ExternalLink, Code2, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import DifficultyBadge from '../common/DifficultyBadge';

const CommandMenu = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/questions?search=${encodeURIComponent(query)}&limit=10`);
        if (res.data.success) {
          setResults(res.data.data || []);
        }
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (question) => {
    onClose();
    navigate(`/questions/${question.questionId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Input header */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all 180 questions by title, number, topic or pattern..."
            className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none text-base"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Searching master dataset...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No matching questions found for "{query}".
            </div>
          )}

          {!loading && !query && (
            <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
              <p className="font-semibold mb-2 uppercase tracking-wider text-gray-400">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onClose(); navigate('/'); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-left text-sm text-gray-700 dark:text-gray-300"
                >
                  <ArrowRight className="w-4 h-4 text-indigo-500" /> Dashboard
                </button>
                <button
                  onClick={() => { onClose(); navigate('/today'); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-left text-sm text-gray-700 dark:text-gray-300"
                >
                  <ArrowRight className="w-4 h-4 text-indigo-500" /> Today's 5 Questions
                </button>
                <button
                  onClick={() => { onClose(); navigate('/questions'); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-left text-sm text-gray-700 dark:text-gray-300"
                >
                  <ArrowRight className="w-4 h-4 text-indigo-500" /> DSA Questions (180 Problems)
                </button>
                <button
                  onClick={() => { onClose(); navigate('/revision'); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-left text-sm text-gray-700 dark:text-gray-300"
                >
                  <ArrowRight className="w-4 h-4 text-indigo-500" /> Spaced Revision Queue
                </button>
                <button
                  onClick={() => { onClose(); navigate('/mock'); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-left text-sm text-gray-700 dark:text-gray-300"
                >
                  <ArrowRight className="w-4 h-4 text-indigo-500" /> Mock Interview Mode
                </button>
                <button
                  onClick={() => { onClose(); navigate('/leaderboard'); }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-left text-sm text-gray-700 dark:text-gray-300"
                >
                  <ArrowRight className="w-4 h-4 text-amber-500" /> Live Leaderboard
                </button>
              </div>
            </div>
          )}

          {results.map((q) => (
            <div
              key={q.questionId}
              onClick={() => handleSelect(q)}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  #{q.questionNumber}
                </span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{q.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{q.topic} {q.pattern ? `• ${q.pattern}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DifficultyBadge difficulty={q.difficulty} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-dark-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Tip: Type problem title, #number, or pattern</span>
          <span className="font-mono">ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandMenu;
