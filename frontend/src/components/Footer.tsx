import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto py-8 text-xs text-gray-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            CE
          </div>
          <span className="font-semibold text-gray-800">Campus Exchange</span>
          <span>- Student Marketplace & Lost-and-Found Platform</span>
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <span>Built for SDE Portfolio</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 ml-1" />
          <span className="font-medium text-gray-700">Verified Campus Network</span>
        </div>
      </div>
    </footer>
  );
};
