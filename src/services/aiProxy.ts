import type { Goal, Notification } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

export async function fetchSuggestions(goals: Goal[]): Promise<Notification[]> {
  const res = await fetch(`${API_BASE}/api/ai/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ goals })
  });
  if (!res.ok) throw new Error(`AI proxy ${res.status}`);
  const data = await res.json() as { suggestions: any[] };

  const goalId = goals[0]?.id || '';
  return (data.suggestions || []).map((s, i) => ({
    id: `ai-${Date.now()}-${i}`,
    title: s.title,
    content: s.content,
    type: s.type,
    goalId,
    source: s.source,
    timestamp: new Date().toISOString(),
    isRead: false,
    relevanceScore: s.relevanceScore ?? 0.8
  }));
}

export async function analyzeGoalProgress(goal: Goal): Promise<{ insight: string; nextStep: string }> {
  const res = await fetch(`${API_BASE}/api/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ goal })
  });
  if (!res.ok) throw new Error(`AI proxy ${res.status}`);
  return res.json();
}


