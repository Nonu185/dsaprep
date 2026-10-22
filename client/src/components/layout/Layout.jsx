import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandMenu from './CommandMenu';
import api from '../../api/client';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [quickSummary, setQuickSummary] = useState({ completedCount: 0, target: 5, streak: 0 });

  useEffect(() => {
    // Global keyboard shortcut: Cmd+K / Ctrl+K
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshPlanSummary = async () => {
    try {
      const res = await api.get('/analytics/summary');
      if (res.data.success) {
        setQuickSummary({
          completedCount: res.data.data.todayCompletedCount,
          target: res.data.data.todayTarget,
          streak: res.data.data.currentStreak
        });
      }
    } catch (err) {
      // Ignore background summary error
    }
  };

  useEffect(() => {
    refreshPlanSummary();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenCommandMenu={() => setIsCommandOpen(true)}
          todayProgress={{ completedCount: quickSummary.completedCount }}
          streak={quickSummary.streak}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ refreshPlanSummary }} />
        </main>
      </div>

      {/* Global Quick Search Palette */}
      <CommandMenu
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
};

export default Layout;
