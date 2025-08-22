import React, { useState } from 'react';
import { Goal } from './types';

// ⬇️ Falls deine Komponenten als named exports kommen, lass die geschweiften Klammern stehen.
//    Wenn sie default-exported sind, nimm die Klammern weg.
import { Dashboard } from './components/Dashboard';
import { InsightsPage } from './components/InsightsPage';
import { GoalForm } from './components/GoalForm';
import { BottomNavigation } from './components/BottomNavigation';

// ✅ wir nutzen den vorhandenen Push-Client
import { enablePushForUser } from './pushClient';

/** Kleine eingebaute Leiste: Tagesfokus starten -> sofort 1 Insight, später 2 Pushes */
function StartFocusBar({ activeGoal }: { activeGoal: Goal | null }) {
  const [status, setStatus] = useState<string>("");

  const startDay = async () => {
    try {
      setStatus("Aktiviere Benachrichtigungen…");
      // iOS braucht User-Geste – wenn schon erlaubt, ist das ein No-Op:
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

      // Sofortiger Insight in der UI als Bestätigung
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
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-2 rounded-xl text-white">
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

  return (
    <div className="relative min-h-screen bg-gray-900 overflow-hidden">
      {/* Hintergrundbild + Overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url(/ai-art-waterfall-sunset-mountains-China-2221536-wallhere.com.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Hauptinhalt */}
      <div className="relative z-10 min-h-screen pb-20">
        {currentPage === 'home' ? (
          <Dashboard goals={goals} onEditGoal={handleEditGoal} />
        ) : (
          <InsightsPage goals={goals} />
        )}

        {/* Tagesfokus starten: nimmt das erste Ziel als aktives */}
        <StartFocusBar activeGoal={goals[0] || null} />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onCreateGoal={handleCreateGoal}
      />

      {/* Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <GoalForm
            goal={editingGoal}
            onSave={handleSaveGoal}
            onCancel={handleCancelGoalForm}
          />
        </div>
      )}
    </div>
  );
}

export default App;