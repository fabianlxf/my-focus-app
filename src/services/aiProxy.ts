import type { Goal, Notification } from '../types';

function toNotifications(suggestions: any[], goalId: string): Notification[] {
  return (suggestions || []).map((s: any, i: number) => ({
    id: `ai-${Date.now()}-${i}`,
    title: String(s?.title ?? 'AI Insight'),
    content: String(s?.content ?? ''),
    // @ts-ignore
    type: (['insight','suggestion','reminder'].includes(String(s?.type)) ? s.type : 'insight'),
    goalId,
    source: String(s?.source ?? 'AI'),
    timestamp: new Date().toISOString(),
    isRead: false,
    relevanceScore: Number.isFinite(Number(s?.relevanceScore)) ? Number(s.relevanceScore) : 0.8
  }));
}

export async function fetchSuggestions(goals: Goal[], timeoutMs = 25000): Promise<Notification[]> {
  const payloadGoals = goals?.length ? goals : [{
    id: 'g1',
    title: 'Sicher sprechen',
    description: 'Redeangst überwinden',
    category: 'mindset',
    priority: 'high',
    progress: 20
  }];

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  const res = await fetch('/api/ai/suggestions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ goals: payloadGoals }),
    signal: ctrl.signal
  }).catch((e) => { throw new Error(`Netzwerkfehler: ${e?.message || e}`); });
  clearTimeout(t);

  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }

  const data = await res.json().catch(() => ({}));
  const goalId = payloadGoals[0]?.id || '';
  return toNotifications(data?.suggestions || [], goalId);
}

export async function analyzeGoalProgress(goal: Goal): Promise<{ insight: string; nextStep: string }> {
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ goal })
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}
export async function generateDayPlan(description: string) {
  const res = await fetch(`${API_BASE}/api/plan/day`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error("Plan generation failed");
  return res.json();
}