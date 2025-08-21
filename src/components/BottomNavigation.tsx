import React from 'react';
import { Home, BarChart3, Plus } from 'lucide-react';

interface BottomNavigationProps {
  currentPage: 'home' | 'insights';
  onPageChange: (page: 'home' | 'insights') => void;
  onCreateGoal: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentPage,
  onPageChange,
  onCreateGoal
}) => {
  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-gray-800/60 backdrop-blur-xl border-t border-white/10 px-4 py-2">
          <div className="flex items-center justify-center space-x-20">
            <button
              onClick={() => onPageChange('home')}
              className={`flex flex-col items-center space-y-1 py-2 px-4 ${
                currentPage === 'home' ? 'text-white' : 'text-white/60'
              }`}
            >
              <Home className="w-6 h-6" strokeWidth={1} />
              <span className="text-xs font-medium">Home</span>
            </button>

            <button
              onClick={() => onPageChange('insights')}
              className={`flex flex-col items-center space-y-1 py-2 px-4 ${
                currentPage === 'insights' ? 'text-white' : 'text-white/60'
              }`}
            >
              <BarChart3 className="w-6 h-6" strokeWidth={1} />
              <span className="text-xs font-medium">Insights</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Plus Button */}
      <button
        onClick={onCreateGoal}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Plus className="w-7 h-7 text-gray-900" strokeWidth={1.5} />
      </button>
    </>
  );
};