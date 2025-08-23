import React from 'react';
import { Goal } from '../types';
import { 
  Briefcase, 
  Heart, 
  GraduationCap, 
  User, 
  DollarSign, 
  Palette,
  MessageCircle,
  Shield,
  Target,
  Brain,
  Dumbbell,
  Book,
  Users,
  Home,
  Clock,
  Lightbulb,
  Music,
  Camera
} from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onClick: (goal: Goal) => void;
  isDarkMode: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick, isDarkMode }) => {
  const getCategoryIcon = (goal: Goal) => {
    const iconProps = { className: "w-4 h-4", strokeWidth: 1.5 };
    
    switch (goal.category) {
      case 'career':
        return <Briefcase {...iconProps} />;
      case 'health':
        return <Heart {...iconProps} />;
      case 'education':
        return <GraduationCap {...iconProps} />;
      case 'financial':
        return <DollarSign {...iconProps} />;
      case 'creative':
        return <Palette {...iconProps} />;
      case 'personal':
        // Check for specific keywords in title and description
        const text = `${goal.title} ${goal.description}`.toLowerCase();
        
        if (text.includes('sprech') || text.includes('reden') || text.includes('kommunik')) {
          return <MessageCircle {...iconProps} />;
        }
        if (text.includes('angst') || text.includes('furcht') || text.includes('panik')) {
          return <Shield {...iconProps} />;
        }
        if (text.includes('ziel') || text.includes('fokus') || text.includes('konzentrat')) {
          return <Target {...iconProps} />;
        }
        if (text.includes('lern') || text.includes('wissen') || text.includes('versteh')) {
          return <Brain {...iconProps} />;
        }
        if (text.includes('fitness') || text.includes('sport') || text.includes('training')) {
          return <Dumbbell {...iconProps} />;
        }
        if (text.includes('lesen') || text.includes('buch') || text.includes('literatur')) {
          return <Book {...iconProps} />;
        }
        if (text.includes('beziehung') || text.includes('freund') || text.includes('familie')) {
          return <Users {...iconProps} />;
        }
        if (text.includes('wohnung') || text.includes('haus') || text.includes('einricht')) {
          return <Home {...iconProps} />;
        }
        if (text.includes('zeit') || text.includes('routine') || text.includes('gewohnheit')) {
          return <Clock {...iconProps} />;
        }
        if (text.includes('kreativ') || text.includes('idee') || text.includes('innovation')) {
          return <Lightbulb {...iconProps} />;
        }
        if (text.includes('musik') || text.includes('instrument') || text.includes('singen')) {
          return <Music {...iconProps} />;
        }
        if (text.includes('foto') || text.includes('bild') || text.includes('kamera')) {
          return <Camera {...iconProps} />;
        }
        
        // Default personal icon
        return <User {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

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
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className={`flex-shrink-0 p-1.5 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                <div className={isDarkMode ? 'text-white/80' : 'text-gray-700'}>
                  {getCategoryIcon(goal)}
                </div>
              </div>
              <h3 className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-semibold text-base line-clamp-1`}>{goal.title}</h3>
            </div>
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