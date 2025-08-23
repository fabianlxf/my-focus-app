import React from 'react';
import { Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
  onClick: (goal: Goal) => void;
  isDarkMode: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick, isDarkMode }) => {
  const categoryColors = {
    career: 'bg-purple-500',
    health: 'bg-green-500',
    education: 'bg-blue-500',
    personal: 'bg-indigo-500',
    financial: 'bg-emerald-500',
    creative: 'bg-pink-500'
  };

  return (
    <div 
      className={`${isDarkMode ? 'bg-black hover:bg-gray-900' : 'bg-white hover:bg-gray-50'} rounded-3xl p-4 ${isDarkMode ? 'border border-white/10' : 'border border-black/10'} cursor-pointer transition-all duration-200`}
      onClick={() => onClick(goal)}
    >
      <div className="w-full">
        <div className="w-full">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-semibold text-base line-clamp-1`}>{goal.title}</h3>
            {goal.targetDate && (
              <span className={`${isDarkMode ? 'text-white/60' : 'text-gray-600'} text-sm ml-2 flex-shrink-0`}>
                {new Date(goal.targetDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </div>

          <p className={`${isDarkMode ? 'text-white/70' : 'text-gray-600'} text-sm mb-4 line-clamp-2`}>{goal.description}</p>

          {/* Progress and Stats */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-4 text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              <span>{goal.progress}%</span>
              <span className="capitalize">{goal.category}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`w-full ${isDarkMode ? 'bg-white/20' : 'bg-black/20'} rounded-full h-2 mt-3`}>
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${categoryColors[goal.category]}`}
              style={{ width: `${goal.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};