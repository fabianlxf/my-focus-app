import React from 'react';
import { Goal } from '../types';
import { Clock } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onClick: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
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
      className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-4 border border-white/10 cursor-pointer hover:bg-gray-800/50 transition-all duration-200"
      onClick={() => onClick(goal)}
    >
      <div className="w-full">
        <div className="w-full">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-white font-semibold text-base line-clamp-1">{goal.title}</h3>
            {goal.targetDate && (
              <span className="text-white/60 text-sm ml-2 flex-shrink-0">
                {new Date(goal.targetDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </div>

          <p className="text-white/70 text-sm mb-4 line-clamp-2">{goal.description}</p>

          {/* Progress and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-white/60">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-white/60" strokeWidth={1} />
                <span>{goal.progress}%</span>
              </div>
              <span className="capitalize">{goal.category}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mt-3">
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