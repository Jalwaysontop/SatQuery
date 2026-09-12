import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center z-10">
      <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10">
        <SettingsIcon className="w-10 h-10 text-blue-400 animate-pulse-slow" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
        Settings
      </h1>
      <p className="text-sm sm:text-base text-gray-400 max-w-md">
        Coming soon
      </p>
    </div>
  );
};
