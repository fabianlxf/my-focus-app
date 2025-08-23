import React, { useState, useEffect } from 'react';
import { Goal, Notification } from '../types';
import { NotificationCard } from './NotificationCard';
import { fetchSuggestions } from '../services/aiProxy';
import { Brain, Settings, Sun, Moon } from 'lucide-react';

interface InsightsPageProps {
  goals: Goal[];
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ goals, isDarkMode, onToggleTheme }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      if (goals.length > 0) {
        const suggestions = await fetchSuggestions(goals);
        setNotifications(suggestions);
      }
      setLoading(false);
    };

    loadNotifications();
  }, [goals]);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  return (
    <div className="px-4 pt-12 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Brain className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} strokeWidth={1} />
          <div>
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Insights</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
            }`}
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6 text-white" strokeWidth={1} />
            ) : (
              <Moon className="w-6 h-6 text-gray-900" strokeWidth={1} />
            )}
          </button>
          <Settings className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} strokeWidth={1} />
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {loading ? (
          <div className={`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-3xl p-8 text-center ${isDarkMode ? 'border border-white/10' : 'border border-black/10'}`}>
            <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Generating insights...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-3xl p-8 text-center ${isDarkMode ? 'border border-white/10' : 'border border-black/10'}`}>
            <Brain className={`w-12 h-12 ${isDarkMode ? 'text-white/60' : 'text-gray-600'} mx-auto mb-4`} strokeWidth={1.5} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No insights yet</h3>
            <p className={`${isDarkMode ? 'text-white/70' : 'text-gray-600'} text-sm`}>Add goals to receive personalized AI insights and recommendations.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              isDarkMode={isDarkMode}
            />
          ))
        )}
      </div>
    </div>
  );
};