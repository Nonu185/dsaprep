import React from 'react';
import { Menu, Sun, Moon, Search, Flame, Target } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ onOpenMobileMenu, onOpenCommandMenu, todayProgress, streak = 0 }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const dailyTarget = user?.preferences?.dailyTarget || 5;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenCommandMenu}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-800/80 text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-500 text-xs transition-colors"
        >
          <Search className="w-4 h-4 text-gray-400" />
          <span className="hidden sm:inline">Search 180 questions, topics, patterns...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ml-2">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Streak indicator */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 text-xs font-semibold"
          title={`Active Day Streak: ${streak} days`}
        >
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span>{streak}d streak</span>
        </div>

        {/* Today's 5 Target badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
          title={`Today's Goal: ${todayProgress?.completedCount || 0} of ${dailyTarget} Solved`}
        >
          <Target className="w-4 h-4 text-indigo-500" />
          <span>{todayProgress?.completedCount || 0}/{dailyTarget} Today</span>
        </div>


        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
