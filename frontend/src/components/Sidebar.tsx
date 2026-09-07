import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Bell,
  Settings,
  Plus,
  Clock,
  PieChart,
  X,
  Layers,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useQueryContext } from '../context/useQueryContext';
import { formatTimeAgo } from '../utils/timeAgo';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const { recentQueries, handleQuerySubmit } = useQueryContext();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'My Data', path: '/my-data', icon: FolderOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleNewQueryClick = () => {
    onCloseMobile?.();
    navigate('/?new=true');
  };

  const handleSelectRecent = (queryText: string) => {
    onCloseMobile?.();
    navigate('/');
    handleQuerySubmit(queryText);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50
          w-[240px] md:w-[230px]
          bg-[#070b16] border-r border-[#151e33]
          flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          h-screen overflow-hidden select-none
        `}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto px-4 pt-5 pb-2">
          {/* Logo */}
          <div className="flex items-center justify-between mb-5">
            <NavLink
              to="/"
              onClick={onCloseMobile}
              className="flex items-center gap-3 group cursor-pointer"
            >
              {/* Diamond / Gem Icon with Blue Gradient */}
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-700 shadow-md shadow-blue-500/25 border border-blue-400/30 group-hover:shadow-blue-500/40 transition-shadow">
                <svg
                  className="w-5 h-5 text-white filter drop-shadow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="6 3 18 3 22 9 12 22 2 9" fill="rgba(255,255,255,0.2)" />
                  <line x1="2" y1="9" x2="22" y2="9" />
                  <polyline points="10 3 12 9 14 3" />
                  <polyline points="2 9 12 22 22 9" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-lg text-white tracking-tight">SatQuery</span>
                  <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">See Earth. Ask More.</p>
              </div>
            </NavLink>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary CTA Button: + New Query */}
          <button
            onClick={handleNewQueryClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-lg transition-all duration-150 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 cursor-pointer group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>New Query</span>
          </button>

          {/* Main Navigation List (NavLinks) */}
          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) => `
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer
                    ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-semibold'
                        : 'text-slate-300 hover:bg-[#121a2e] hover:text-white'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-[#151e33] my-4" />

          {/* Recent Queries Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Recent Queries
              </span>
              <Sparkles className="w-3 h-3 text-blue-400" />
            </div>

            {/* If no queries, show empty state */}
            {recentQueries.length === 0 ? (
              <div className="px-2 py-4 text-center rounded-lg bg-[#0e1424]/60 border border-slate-800/40 my-2">
                <Inbox className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-400 leading-snug">
                  Your recent queries will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentQueries.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectRecent(item.text)}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#101729] border border-transparent hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:border-blue-400/50">
                        <Clock className="w-2.5 h-2.5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 group-hover:text-blue-300 font-normal truncate leading-snug">
                          {item.text}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {formatTimeAgo(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Pinned Card */}
        <div className="p-3 border-t border-[#151e33] bg-[#050812]">
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0c1222] border border-slate-800/80">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 flex-shrink-0 mt-0.5">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-normal leading-tight">
                A cleaner planet with clearer answers
              </p>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-blue-400 font-medium font-mono">
                <Layers className="w-2.5 h-2.5" />
                <span>Sentinel & SAR Powered</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
