import React, { useState, useEffect } from 'react';
import { Goal, Notification } from '../types';
import { NotificationCard } from './NotificationCard';
import { fetchSuggestions } from '../services/aiProxy';
import { Brain, Settings } from 'lucide-react';

interface InsightsPageProps {
  goals: Goal[];
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ goals }) => {
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
          <Brain className="w-8 h-8 text-white" strokeWidth={1} />
          <div>
            <h1 className="text-xl font-semibold text-white">AI Insights</h1>
          </div>
        </div>
        
        <Settings className="w-6 h-6 text-white" strokeWidth={1} />
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10">
            <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Generating insights...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/10">
            <Brain className="w-12 h-12 text-white/60 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="font-semibold text-white mb-2">No insights yet</h3>
            <p className="text-white/70 text-sm">Add goals to receive personalized AI insights and recommendations.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
};