import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { AppBackdrop } from './AppBackdrop';

export const Layout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 flex flex-col md:flex-row relative selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans">
      {/* 1. Fixed Left Sidebar (~230px wide, bg #070b16) */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 md:ml-[230px] flex flex-col justify-between min-h-screen relative overflow-hidden bg-[#02050e]">
        {/* Cinematic Realistic Space Background */}
        <AppBackdrop />

        {/* Top Nav Bar (Right-aligned, transparent bg) */}
        <TopNav
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLinkClick={(link) => {
            console.log(`[TopNav] Navigated to ${link}`);
            if (link === 'Datasets') navigate('/explore');
            if (link === 'About') navigate('/about');
            if (link === 'Help') navigate('/settings');
          }}
        />

        {/* Dynamic Route Content */}
        <div className="flex-1 flex flex-col justify-center py-1 sm:py-3 z-10">
          <Outlet />
        </div>

        <footer className="w-full px-6 py-3 flex items-center justify-center z-10 border-t border-slate-900/80 bg-[#02050e]/80 backdrop-blur-md">
          <p className="text-[11px] text-slate-500 text-center">
            SatQuery AI can make mistakes. Please double-check important responses.
          </p>
        </footer>
      </main>
    </div>
  );
};
