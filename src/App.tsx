import React, { useState } from 'react';
import { Goal } from './types';
import { Dashboard } from './components/Dashboard';
import { InsightsPage } from './components/InsightsPage';
import { GoalForm } from './components/GoalForm';
import { BottomNavigation } from './components/BottomNavigation';
 

function App() {
  

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Master React Development',
      description: 'Become proficient in React, including hooks, context, and advanced patterns to build modern web applications.',
      category: 'education',
      priority: 'high',
      progress: 65,
      createdAt: '2024-01-15',
      targetDate: '2024-06-15',
      tags: ['programming', 'frontend', 'react', 'javascript']
    },
    {
      id: '2',
      title: 'Improve Physical Fitness',
      description: 'Establish a consistent workout routine and improve overall health through regular exercise and proper nutrition.',
      category: 'health',
      priority: 'medium',
      progress: 45,
      createdAt: '2024-01-10',
      targetDate: '2024-12-31',
      tags: ['fitness', 'health', 'exercise', 'nutrition']
    }
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
      setGoals(prev => prev.map(goal => 
        goal.id === editingGoal.id 
          ? { ...goalData, id: editingGoal.id, createdAt: editingGoal.createdAt }
          : goal
      ));
    } else {
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
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
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/ai-art-waterfall-sunset-mountains-China-2221536-wallhere.com.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen pb-20">
        {currentPage === 'home' ? (
          <Dashboard
            goals={goals}
            onEditGoal={handleEditGoal}
          />
        ) : (
          <InsightsPage goals={goals} />
        )}
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