import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { SearchBar } from '../components/SearchBar';

export const Home: React.FC = () => {
  return (
    <div className="w-full flex flex-col justify-center">
      {/* Hero Section (Headings, Capability Chips, Photorealistic Earth, Focus Card) */}
      <HeroSection />

      {/* Bottom Search Bar (~800px wide, rounded-full, mic/attachment/globe/send buttons, suggestions) */}
      <SearchBar />
    </div>
  );
};
