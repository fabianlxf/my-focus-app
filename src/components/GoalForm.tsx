import React, { useState } from 'react';
import { Goal, GoalCategory, Priority } from '../types';
import { Save, X } from 'lucide-react';

interface GoalFormProps {
  goal?: Goal;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({ goal, onSave, onCancel }) => {
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
    <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full mx-4 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          {goal ? 'Edit Goal' : 'Create Goal'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white/70" strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Goal Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/30 focus:border-transparent text-white placeholder-white/60 backdrop-blur-sm"
            placeholder="Enter your goal title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/30 focus:border-transparent text-white placeholder-white/60 backdrop-blur-sm"
            placeholder="Describe your goal"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalCategory })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/30 focus:border-transparent text-white backdrop-blur-sm"
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
            <label className="block text-sm font-medium text-white/90 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/30 focus:border-transparent text-white backdrop-blur-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Target Date (Optional)
          </label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/30 focus:border-transparent text-white backdrop-blur-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Progress: {formData.progress}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-white text-gray-900 px-4 py-3 rounded-2xl hover:bg-white/90 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
          >
            <Save className="w-4 h-4" strokeWidth={1.5} />
            <span>{goal ? 'Update' : 'Create'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 border border-white/20 text-white/80 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};