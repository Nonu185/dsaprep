import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Code2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Award
} from 'lucide-react';
import api from '../api/client';
import DifficultyBadge from '../components/common/DifficultyBadge';

const MockInterview = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  // Setup options
  const [questionCount, setQuestionCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterTopic, setFilterTopic] = useState('All');
  const [hideNotes, setHideNotes] = useState(true);

  // Active session states
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(45 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [resultsMap, setResultsMap] = useState({}); // qId -> 'Solved' | 'Attempted' | 'Skipped'

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (sessionActive && !isPaused && !sessionFinished) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setSessionFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, isPaused, sessionFinished]);

  // Start interview session
  const handleStartSession = async () => {
    try {
      const params = new URLSearchParams({
        limit: 'all',
        topic: filterTopic,
        difficulty: filterDifficulty
      });

      const res = await api.get(`/questions?${params.toString()}`);
      if (res.data.success) {
        let pool = res.data.data || [];
        // Shuffle pool
        pool = [...pool].sort(() => 0.5 - Math.random());
        const chosen = pool.slice(0, questionCount);

        if (chosen.length === 0) {
          alert('No questions match the selected difficulty and topic filter.');
          return;
        }

        setSelectedQuestions(chosen);
        setCurrentIdx(0);
        setTimeLeftSeconds(durationMinutes * 60);
        setIsPaused(false);
        setSessionFinished(false);
        setSessionActive(true);

        const initResults = {};
        chosen.forEach((q) => {
          initResults[q.questionId] = 'Unsolved';
        });
        setResultsMap(initResults);
      }
    } catch (err) {
      alert(`Error starting session: ${err.message}`);
    }
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to conclude the mock interview and view your score?')) {
      setSessionFinished(true);
    }
  };

  const handleMarkCurrent = async (status) => {
    const q = selectedQuestions[currentIdx];
    if (!q) return;

    setResultsMap((prev) => ({
      ...prev,
      [q.questionId]: status
    }));

    if (status === 'Solved') {
      try {
        await api.put(`/progress/${q.questionId}`, { status: 'Solved' });
      } catch (err) {
        // Continue
      }
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeQuestion = selectedQuestions[currentIdx];

  return (
    <div className="space-y-6">
      {/* Configuration View (Before start) */}
      {!sessionActive && !sessionFinished && (
        <div className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Timer className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Mock Technical Interview Mode
            </h1>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Simulate actual placement coding assessments under real-time constraints. Pick problems randomly from your 180 master list.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-900"
                >
                  <option value={1}>1 Question (Quick Test)</option>
                  <option value={2}>2 Questions (Standard 45m round)</option>
                  <option value={3}>3 Questions (TCS / Infosys / OA round)</option>
                  <option value={4}>4 Questions (Product Company OA)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Session Timer Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-900"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes</option>
                  <option value={90}>90 Minutes (Full OA)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Filter Difficulty
                </label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-900"
                >
                  <option value="All">All Difficulties (Balanced)</option>
                  <option value="Easy">Easy Only</option>
                  <option value="Medium">Medium Only</option>
                  <option value="Hard">Hard Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Specific Topic
                </label>
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-900"
                >
                  <option value="All">All 14 Topics (Random)</option>
                  <option value="Arrays & Fundamentals">Arrays & Fundamentals</option>
                  <option value="Strings">Strings</option>
                  <option value="Binary Search & Sorting">Binary Search & Sorting</option>
                  <option value="Linked List">Linked List</option>
                  <option value="Trees & BST">Trees & BST</option>
                  <option value="Dynamic Programming">Dynamic Programming</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="hideNotes"
                checked={hideNotes}
                onChange={(e) => setHideNotes(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="hideNotes" className="text-xs text-gray-700 dark:text-gray-300">
                Hide existing hints, approaches, and previous notes during the session
              </label>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Begin Mock Assessment</span>
          </button>
        </div>
      )}

      {/* Active Session View */}
      {sessionActive && !sessionFinished && (
        <div className="space-y-4">
          {/* Active Header with Timer */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Question {currentIdx + 1} of {selectedQuestions.length}
              </span>
              <div className="flex items-center gap-1 ml-2">
                {selectedQuestions.map((q, idx) => (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                      currentIdx === idx
                        ? 'bg-indigo-600 text-white'
                        : resultsMap[q.questionId] === 'Solved'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Display */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${
                timeLeftSeconds < 300
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
              }`}>
                <Timer className="w-4 h-4" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                title={isPaused ? 'Resume Timer' : 'Pause Timer'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={handleEndSession}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                End Session
              </button>
            </div>
          </div>

          {/* Active Problem & Editor Layout */}
          {activeQuestion && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-400">#{activeQuestion.questionNumber}</span>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{activeQuestion.title}</h2>
                    <DifficultyBadge difficulty={activeQuestion.difficulty} size="xs" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{activeQuestion.topic} {activeQuestion.pattern ? `• Pattern: ${activeQuestion.pattern}` : ''}</p>
                </div>

                <div className="flex items-center gap-2">
                  {activeQuestion.practiceUrl && (
                    <a
                      href={activeQuestion.practiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Solve on External Platform</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleMarkCurrent('Solved')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Solved</span>
                  </button>

                  <button
                    onClick={() => handleMarkCurrent('Attempted')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    Attempted
                  </button>
                </div>
              </div>

              {/* Interview Scratchpad & Mental Model */}
              <div className="p-5 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Interview Problem Scratchpad & Logic Explanation
                  </h3>
                  <span className="text-xs text-gray-400">Think out loud and structure your complexity</span>
                </div>
                <textarea
                  rows="12"
                  placeholder="Outline your mental model, edge cases, time/space complexity analysis, and approach before solving..."
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finished Summary Scorecard */}
      {sessionFinished && (
        <div className="max-w-xl mx-auto p-6 md:p-8 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-lg space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Mock Interview Completed
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Assessment Summary & Results
            </p>
          </div>

          {/* Stats Breakdown */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-gray-800">
            <div>
              <span className="text-[11px] text-gray-400 block">Total Problems</span>
              <span className="text-lg font-bold font-mono">{selectedQuestions.length}</span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Solved</span>
              <span className="text-lg font-bold font-mono text-emerald-600">
                {Object.values(resultsMap).filter(v => v === 'Solved').length}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Time Left</span>
              <span className="text-lg font-bold font-mono text-indigo-600">
                {formatTimer(timeLeftSeconds)}
              </span>
            </div>
          </div>

          {/* Questions review list */}
          <div className="text-left space-y-2">
            <h4 className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Question Summary
            </h4>
            {selectedQuestions.map((q) => (
              <div
                key={q.questionId}
                className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-dark-700/50 text-xs border border-gray-100 dark:border-gray-700"
              >
                <div>
                  <span className="font-mono text-gray-400 mr-2">#{q.questionNumber}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{q.title}</span>
                </div>
                <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  resultsMap[q.questionId] === 'Solved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-gray-200 text-gray-700 dark:bg-dark-600 dark:text-gray-300'
                }`}>
                  {resultsMap[q.questionId] || 'Unsolved'}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setSessionActive(false);
              setSessionFinished(false);
            }}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
          >
            Start Another Mock Session
          </button>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
