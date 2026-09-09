import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { SearchBar } from '../components/SearchBar';
import { ChatView } from '../components/ChatView';
import { useQueryContext } from '../context/useQueryContext';

export const Home: React.FC = () => {
  const { chatMode } = useQueryContext();

  if (chatMode) {
    return (
      // Chat view: fills the full flex column from Layout, no hero
      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <ChatView />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-center">
      {/* Hero Section (Headings, Capability Chips, Photorealistic Earth) */}
      <HeroSection />

      {/* Search Bar with suggestion chips */}
      <SearchBar />
    </div>
  );
};
