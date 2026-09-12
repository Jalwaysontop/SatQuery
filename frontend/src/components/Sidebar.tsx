import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Settings,
  Plus,
  Clock,
  PieChart,
  X,
  Layers,
  Sparkles,
  Inbox,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

/** Minimal satellite-orbiting-earth icon — matches the provided brand mark */
const SatelliteOrbitIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Earth circle */}
    <circle cx="24" cy="24" r="10.5" stroke="white" strokeWidth="2.2" fill="none" />
    {/* Orbital ellipse ring */}
    <ellipse cx="24" cy="24" rx="20" ry="8.5" stroke="white" strokeWidth="1.8" fill="none" />
    {/* Satellite body */}
    <rect x="20.5" y="7" width="4.2" height="3" rx="0.7" fill="white" />
    {/* Left solar panel */}
    <rect x="15.5" y="7.8" width="4.5" height="1.5" rx="0.4" fill="white" />
    {/* Right solar panel */}
    <rect x="25.2" y="7.8" width="4.5" height="1.5" rx="0.4" fill="white" />
    {/* Signal arc 1 */}
    <path d="M28.5 11.5 Q31.5 14 29.5 17.5" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    {/* Signal arc 2 */}
    <path d="M30.5 10 Q35 13.5 32.5 19" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
  </svg>
);
import { useQueryContext } from '../context/useQueryContext';
import { formatTimeAgo } from '../utils/timeAgo';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const { recentQueries, handleQuerySubmit, clearChat, conversations, loadConversation } = useQueryContext();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'My Data', path: '/my-data', icon: FolderOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleNewQueryClick = () => {
    onCloseMobile?.();
    clearChat();
    navigate('/');
  };

  const handleSelectRecent = (id: string, text: string) => {
    onCloseMobile?.();
    navigate('/');
    if (conversations[id]) {
      loadConversation(id);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar — flex column, fully fixed height, NO outer scroll */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50
          bg-[#070b16] border-r border-[#151e33]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:w-[56px]' : 'md:w-[230px]'}
          w-[230px]
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          h-screen select-none overflow-hidden
        `}
      >

        {/* ═══════════════════════════════════════════════════════════════════
            FROZEN TOP SECTION — never scrolls
        ═══════════════════════════════════════════════════════════════════ */}

        {/* ── COLLAPSED STATE: only the expand button, perfectly centred ── */}
        {isCollapsed && (
          <div className="flex-shrink-0 flex flex-col items-center pt-4 pb-2">
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/70 hover:bg-blue-600/20 border border-slate-700/60 hover:border-blue-500/40 text-slate-400 hover:text-blue-300 transition-all duration-200 cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── EXPANDED STATE: full logo row + nav + recent header ── */}
        {!isCollapsed && (
          <div className="flex-shrink-0 px-4 pt-5 pb-2">

            {/* Logo Row */}
            <div className="flex items-center justify-between mb-5">
              {/* Logo */}
              <NavLink to="/" onClick={onCloseMobile} className="flex items-center gap-3 group cursor-pointer min-w-0">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-700 shadow-md shadow-blue-500/25 border border-blue-400/30 group-hover:shadow-blue-500/40 transition-shadow">
                  <SatelliteOrbitIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg text-white tracking-tight">SatQuery</span>
                    <span className="text-[9px] font-mono font-semibold uppercase px-1.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">See Earth. Ask More.</p>
                </div>
              </NavLink>

              {/* Collapse + mobile-close buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={onToggleCollapse}
                  className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-white transition-all duration-150 cursor-pointer"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={onCloseMobile} className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* New Query CTA */}
            <button
              onClick={handleNewQueryClick}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-all shadow-lg shadow-blue-600/25 cursor-pointer group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
              <span>New Query</span>
            </button>

            {/* Main Nav Links */}
            <nav className="mt-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 w-full rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer
                      ${isActive
                        ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-semibold'
                        : 'text-slate-300 hover:bg-[#121a2e] hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }: { isActive: boolean }) => (
                      <>
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* "Recent Queries" section header */}
            <div className="mt-4 border-t border-[#151e33] pt-4">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Recent Queries
                </span>
                <Sparkles className="w-3 h-3 text-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SCROLLABLE RECENT QUERIES — only shows when expanded
        ═══════════════════════════════════════════════════════════════════ */}
        {!isCollapsed && (
          <div
            className="flex-1 overflow-y-auto min-h-0 px-4 pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            {recentQueries.length === 0 ? (
              <div className="px-2 py-4 text-center rounded-lg bg-[#0e1424]/60 border border-slate-800/40">
                <Inbox className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-400 leading-snug">Your recent queries will appear here</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentQueries.map((item) => {
                  const isRestorable = !!conversations[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectRecent(item.id, item.text)}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#101729] border border-transparent hover:border-slate-800/80 transition-all duration-150 group cursor-pointer"
                      title={item.text}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                          ${isRestorable
                            ? 'bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-400/50'
                            : 'bg-slate-700/40 border border-slate-600/30'}`}
                        >
                          <MessageSquare className={`w-2.5 h-2.5 ${isRestorable ? 'text-blue-400' : 'text-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 group-hover:text-blue-300 truncate leading-snug">
                            {item.text}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeAgo(item.timestamp)}
                            {!isRestorable && <span className="text-slate-600 ml-1">· session ended</span>}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Collapsed: flex-1 spacer so bottom card stays pinned */}
        {isCollapsed && <div className="flex-1" />}

        {/* ═══════════════════════════════════════════════════════════════════
            FROZEN BOTTOM CARD — only shown when expanded
        ═══════════════════════════════════════════════════════════════════ */}
        {!isCollapsed && (
          <div className="flex-shrink-0 p-3 border-t border-[#151e33] bg-[#050812]">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0c1222] border border-slate-800/80">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 flex-shrink-0 mt-0.5">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-300 leading-tight">A cleaner planet with clearer answers</p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-blue-400 font-mono">
                  <Layers className="w-2.5 h-2.5" />
                  <span>Sentinel &amp; SAR Powered</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
