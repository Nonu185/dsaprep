import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarCheck2,
  RotateCcw,
  Timer,
  BarChart3,
  Settings,
  Trophy,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'DSA Questions', path: '/questions', icon: CheckSquare, badge: '180' },
  { name: "Today's Plan", path: '/today', icon: CalendarCheck2, badge: '5/day' },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, badge: 'Live' },
  { name: 'Revision Queue', path: '/revision', icon: RotateCcw },
  { name: 'Mock Interview', path: '/mock', icon: Timer },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings }
];

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white dark:bg-[#0E131F] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Terminal className="w-5 h-5 stroke-[2.2]" />
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate">
                <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight block">
                  DSA Placement <span className="text-indigo-600 dark:text-indigo-400">OS</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">
                  BCA 180 Problem Engine
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>


        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800/80 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 stroke-[2]" />
                {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}
                {!isCollapsed && item.badge && (
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-current">
                    {item.badge}
                  </span>
                )}
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <div className="flex items-center gap-3 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full shrink-0 border border-purple-400/40 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs shrink-0 border border-indigo-200 dark:border-indigo-800">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="truncate">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {user?.name || 'Candidate'}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
