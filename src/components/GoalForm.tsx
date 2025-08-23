import React, { useState } from 'react';
import { Goal, GoalCategory, Priority } from '../types';
import { Save, X } from 'lucide-react';

interface GoalFormProps {
  goal?: Goal;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export const GoalForm: React.FC<GoalFormProps> = ({ goal, onSave, onCancel, isDarkMode }) => {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || 'personal' as GoalCategory,
    priority: goal?.priority || 'medium' as Priority,
    targetDate: goal?.targetDate || '',
    progress: goal?.progress || 0,
    tags: goal?.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
  };

  return (
    <div className={`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-3xl p-6 max-w-sm w-full mx-4 ${isDarkMode ? 'border border-white/20' : 'border border-black/20'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {goal ? 'Edit Goal' : 'Create Goal'}
        </h3>
        <button
          onClick={onCancel}
          className={`p-1 ${isDarkMode ? 'hover:bg-white/20' : 'hover:bg-black/20'} rounded-full transition-colors`}
        >
          <X className={`w-5 h-5 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`} strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-gray-800'} mb-2`}>
            Goal Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-4 py-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-white/60' : 'bg-black/10 border-black/20 text-gray-900 placeholder-gray-500'} border rounded-2xl focus:ring-2 ${isDarkMode ? 'focus:ring-white/30' : 'focus:ring-black/30'} focus:border-transparent`}
            placeholder="Enter your goal title"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-gray-800'} mb-2`}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full px-4 py-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-white/60' : 'bg-black/10 border-black/20 text-gray-900 placeholder-gray-500'} border rounded-2xl focus:ring-2 ${isDarkMode ? 'focus:ring-white/30' : 'focus:ring-black/30'} focus:border-transparent`}
            placeholder="Describe your goal"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-gray-800'} mb-2`}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalCategory })}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-gray-900'} border rounded-2xl focus:ring-2 ${isDarkMode ? 'focus:ring-white/30' : 'focus:ring-black/30'} focus:border-transparent`}
            >
              <option value="career">Career</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="personal">Personal</option>
              <option value="financial">Financial</option>
              <option value="creative">Creative</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-gray-800'} mb-2`}>
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-gray-900'} border rounded-2xl focus:ring-2 ${isDarkMode ? 'focus:ring-white/30' : 'focus:ring-black/30'} focus:border-transparent`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-gray-800'} mb-2`}>
            Target Date (Optional)
          </label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            className={`w-full px-4 py-3 ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-gray-900'} border rounded-2xl focus:ring-2 ${isDarkMode ? 'focus:ring-white/30' : 'focus:ring-black/30'} focus:border-transparent`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-white/90' : 'text-gray-800'} mb-2`}>
            Progress: {formData.progress}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
            className={`w-full h-2 ${isDarkMode ? 'bg-white/20' : 'bg-black/20'} rounded-lg appearance-none cursor-pointer slider`}
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className={`flex-1 ${isDarkMode ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-black text-white hover:bg-gray-800'} px-4 py-3 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 font-medium`}
          >
            <Save className="w-4 h-4" strokeWidth={1.5} />
            <span>{goal ? 'Update' : 'Create'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-3 border ${isDarkMode ? 'border-white/20 text-white/80 hover:bg-white/10' : 'border-black/20 text-gray-700 hover:bg-black/10'} rounded-2xl transition-colors`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};