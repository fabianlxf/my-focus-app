import React, { useState } from 'react';
import { Goal } from './types';
import { Moon, Sun } from 'lucide-react';

import { Dashboard } from './components/Dashboard';
import { InsightsPage } from './components/InsightsPage';
import { GoalForm } from './components/GoalForm';
import { BottomNavigation } from './components/BottomNavigation';

import { enablePushForUser } from './pushClient';

function StartFocusBar({ activeGoal }: { activeGoal: Goal | null }) {
  const [status, setStatus] = useState<string>("");

  const startDay = async () => {
    try {
      setStatus("Aktiviere Benachrichtigungen…");
      await enablePushForUser("demo-user");

      if (!activeGoal) {
        setStatus("Kein Ziel gefunden.");
        return;
      }

      setStatus("Starte Tagesfokus…");
      const res = await fetch("/api/insights/start-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user",
          goal: {
            title: activeGoal.title,
            category: activeGoal.category,
            priority: activeGoal.priority,
            progress: activeGoal.progress,
            description: activeGoal.description
          }
        })
      });

      if (!res.ok) throw new Error("Start fehlgeschlagen");
      const data = await res.json();

      if (data?.insight?.title) {
        setStatus(`Insight: ${data.insight.title}`);
        setTimeout(() => setStatus("Tagesfokus läuft ✅"), 1500);
      } else {
        setStatus("Tagesfokus läuft ✅");
      }
    } catch (e: any) {
      setStatus(e?.message || "Fehler");
    }
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-40 flex items-center gap-2 bg-black px-3 py-2 rounded-xl text-white">
      <button
        onClick={startDay}
        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded transition"
      >
        Fokus-Tag starten
      </button>
      <span className="text-sm opacity-80">{status}</span>
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Master React Development',
      description:
        'Become proficient in React, including hooks, context, and advanced patterns to build modern web applications.',
      category: 'education',
      priority: 'high',
      progress: 65,
      createdAt: '2024-01-15',
      targetDate: '2024-06-15',
      tags: ['programming', 'frontend', 'react', 'javascript'],
    },
    {
      id: '2',
      title: 'Improve Physical Fitness',
      description:
        'Establish a consistent workout routine and improve overall health through regular exercise and proper nutrition.',
      category: 'health',
      priority: 'medium',
      progress: 45,
      createdAt: '2024-01-10',
      targetDate: '2024-12-31',
      tags: ['fitness', 'health', 'exercise', 'nutrition'],
    },
  ]);

  const [currentPage, setCurrentPage] = useState<'home' | 'insights'>('home');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      setGoals(prev =>
        prev.map(goal =>
          goal.id === editingGoal.id
            ? { ...goalData, id: editingGoal.id, createdAt: editingGoal.createdAt }
            : goal
        )
      );
    } else {
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setGoals(prev => [...prev, newGoal]);
    }
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleCancelGoalForm = () => {
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Hintergrundbild + Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            isDarkMode 
              ? 'url(/ai-art-waterfall-sunset-mountains-China-2221536-wallhere.com.jpg)'
              : 'url(/Zhangjiajie-National-Park-China-Sun-pillar-clouds-artwork-2186975-wallhere.com\\ \\(1\\).jpg)',
        }}
      >
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-white/70'}`} />
      </div>

      {/* Hauptinhalt */}
      <div className="relative z-10 min-h-screen pb-24">
        {currentPage === 'home' ? (
          <Dashboard goals={goals} onEditGoal={handleEditGoal} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
        ) : (
          <InsightsPage goals={goals} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
        )}

        <StartFocusBar activeGoal={goals[0] || null} />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onCreateGoal={handleCreateGoal}
        isDarkMode={isDarkMode}
      />

      {showGoalForm && (
        <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-white/60'} backdrop-blur-sm flex items-center justify-center p-4 z-50`}>
          <GoalForm
            goal={editingGoal}
            onSave={handleSaveGoal}
            onCancel={handleCancelGoalForm}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
}

export default App;