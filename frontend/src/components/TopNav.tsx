import React from 'react';
import { Menu, Info } from 'lucide-react';

interface TopNavProps {
  onOpenMobileSidebar?: () => void;
  onLinkClick?: (link: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileSidebar,
  onLinkClick,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-transparent z-30 relative">
      {/* Left side: Hamburger button visible on mobile */}
      <div className="flex items-center gap-3 md:invisible">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 text-gray-300 hover:text-white bg-[#141926]/80 hover:bg-[#1f2639] border border-slate-800 rounded-lg transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-bold text-white tracking-tight text-base md:hidden">SatQuery</span>
      </div>

      {/* Spacer for desktop layout */}
      <div className="hidden md:block" />

      {/* Right side navigation & Avatar */}
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-5 sm:gap-6 text-xs sm:text-sm font-medium">

          <button
            onClick={() => onLinkClick?.('About')}
            className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
            <span>About</span>
          </button>
        </nav>

        {/* Circular user avatar (blue bg, letter "S", white text) */}
        <div className="flex items-center pl-2 border-l border-slate-800/80">
          <div
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center ring-2 ring-blue-500/30 shadow-md shadow-blue-500/20 cursor-pointer transition-transform hover:scale-105 select-none"
            title="User Profile (SatQuery Explorer)"
          >
            S
          </div>
        </div>
      </div>
    </header>
  );
};
