// server.ts – Ein-Port Dev-Server: Express + Vite + API + Push + Tagesplanung
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OpenAI } from 'openai';
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT ?? 1234);

// --- Middleware
app.use(cors());
app.use(express.json());

// --- OpenAI (nutzt Responses-API mit output_text)
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// --- Web Push Setup
webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// In-Memory Stores (Dev)
const subscriptions = new Map<string, PushSubscription>(); // userId -> subscription
type MiniGoal = { title: string; category: string; priority: string; progress: number; description: string; };
const dayPlans = new Map<string, string>();                 // userId -> YYYY-MM-DD (nur 1x pro Tag planen)
const dayTimers = new Map<string, NodeJS.Timeout[]>();      // userId -> geplante Timer

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- AI-Helfer
async function generateOneInsight(goal: MiniGoal): Promise<{ title: string; content: string }> {
  try {
    if (!client) {
      return { title: 'Focus', content: 'Take a clear 5-minute step now.' };
    }
    const r = await client.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_output_tokens: 250,
      input: [
        { role: 'system', content: 'Return ONLY JSON: {"title":"...","content":"..."} with concise, practical, research-backed tip.' },
        { role: 'user', content: `Create one focused insight for this goal:\n${JSON.stringify(goal)}` }
      ]
    });
    const text = (r as any).output_text as string | undefined;
    return JSON.parse(text ?? '{}');
  } catch {
    return { title: 'Focus', content: 'Take a clear 5-minute step now.' };
  }
}

// --- Tagesplanung
function schedulePush(userId: string, minutesFromNow: number, goal: MiniGoal) {
  const timers = dayTimers.get(userId) ?? [];
  const t = setTimeout(async () => {
    try {
      const sub = subscriptions.get(userId);
      if (!sub) return; // kein Abo vorhanden (oder Server restart)
      const insight = await generateOneInsight(goal);
      await webpush.sendNotification(sub, JSON.stringify({
        title: `Neuer Insight: ${insight.title || 'Weiterkommen'}`,
        body: (insight.content || 'Kleiner, klarer Schritt jetzt.').slice(0, 120),
        url: '/today'
      }));
    } catch (e) {
      console.error('[push scheduled] error', e);
    }
  }, minutesFromNow * 60 * 1000);
  timers.push(t);
  dayTimers.set(userId, timers);
}

// --- Startet einen Fokus-Tag: Sofort-Insight + 2 spätere Pushes
app.post('/api/insights/start-day', async (req, res) => {
  try {
    const { userId, goal } = req.body || {};
    if (!userId || !goal) return res.status(400).json({ error: 'userId + goal required' });

    const today = new Date().toISOString().slice(0, 10);
    let planned = false;

    if (dayPlans.get(userId) !== today) {
      // Alte Timer stoppen
      const old = dayTimers.get(userId) || [];
      old.forEach(clearTimeout);
      dayTimers.delete(userId);

      // 2 Benachrichtigungen im Tagesverlauf (Zeitpunkte anpassen nach Wunsch)
      schedulePush(userId, 180, goal); // +3h
      schedulePush(userId, 420, goal); // +7h

      dayPlans.set(userId, today);
      planned = true;
    }

    const insight = await generateOneInsight(goal);
    return res.json({ planned, insight });
  } catch (e) {
    console.error('[start-day] error', e);
    return res.status(500).json({ error: 'start-day failed' });
  }
});

// --- OPTIONAL: frühere AI-Endpunkte (falls benutzt)
app.post('/api/ai/suggestions', async (req, res) => {
  try {
    if (!client) {
      return res.json({
        suggestions: [
          {
            title: 'Start Small',
            content: 'Break your goal into 5-minute actionable steps. Small progress compounds over time.',
            type: 'insight',
            source: 'Focus Coach',
            relevanceScore: 0.9
          },
          {
            title: 'Daily Consistency',
            content: 'Focus on showing up every day rather than perfect performance. Consistency beats intensity.',
            type: 'suggestion',
            source: 'Focus Coach',
            relevanceScore: 0.8
          },
          {
            title: 'Track Progress',
            content: 'Document your daily wins, no matter how small. Progress visibility boosts motivation.',
            type: 'insight',
            source: 'Focus Coach',
            relevanceScore: 0.85
          }
        ]
      });
    }

    const goals = (req.body?.goals ?? []) as Array<any>;
    const goalsContext = goals.map(g =>
      `Goal: ${g.title} (${g.category}, ${g.priority} priority, ${g.progress}% complete) - ${g.description}`
    ).join('\n');

    const r = await client.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_output_tokens: 800,
      input: [
        { role: 'system', content: 'Return ONLY JSON: {"suggestions":[{title,content,type,source,relevanceScore},...]}' },
        { role: 'user', content: `Based on these goals, provide 3-4 items.\n\n${goalsContext}` }
      ]
    });

    const text = (r as any).output_text as string | undefined;
    const json = (() => { try { return JSON.parse(text ?? '{}'); } catch { return { suggestions: [] }; }})();
    return res.json(json);
  } catch (e) {
    console.error('suggestions error', e);
    return res.status(500).json({ error: 'AI suggestions failed' });
  }
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    if (!client) {
      return res.json({
        insight: 'Focus on one small step at a time. Progress happens through consistent daily action.',
        nextStep: 'Identify the smallest possible action you can take right now and do it for 5 minutes.'
      });
    }

    const g = req.body?.goal ?? {};
    const r = await client.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_output_tokens: 200,
      input: [
        { role: 'system', content: 'Return ONLY JSON: {"insight":"...","nextStep":"..."}' },
        { role: 'user', content: `Analyze: ${JSON.stringify(g)}` }
      ]
    });

    const text = (r as any).output_text as string | undefined;
    const json = (() => { try { return JSON.parse(text ?? '{}'); } catch { return {}; }})();
    return res.json({
      insight: json.insight ?? 'Keep going!',
      nextStep: json.nextStep ?? 'Do one 10-minute step now.'
    });
  } catch (e) {
    console.error('analyze error', e);
    return res.status(500).json({ error: 'AI analyze failed' });
  }
});

// --- Push-API
app.post('/api/push/save-subscription', (req, res) => {
  const { userId, subscription } = req.body || {};
  if (!userId || !subscription) return res.status(400).json({ error: 'userId + subscription required' });
  subscriptions.set(userId, subscription);
  console.log('[PUSH] save-subscription for', userId);
  return res.json({ ok: true });
});

app.post('/api/push/send', async (req, res) => {
  const { userId, title, body, url } = req.body || {};
  const sub = subscriptions.get(userId);
  if (!sub) return res.status(404).json({ error: 'no subscription for user' });
  try {
    await webpush.sendNotification(sub, JSON.stringify({
      title: title || 'Test-Nudge',
      body: body || 'Hallo! Das ist eine Test-Benachrichtigung.',
      url: url || '/'
    }));
    console.log('[PUSH] sent to', userId);
    return res.json({ ok: true });
  } catch (e) {
    console.error('push error', e);
    return res.status(500).json({ error: 'push failed' });
  }
});

// --- DEV: Vite-Middleware (liefert UI & Assets) / PROD: dist/
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await (await import('vite')).createServer({
      root: process.cwd(),
      server: { middlewareMode: true, host: true, port: PORT }
    });
    app.use(vite.middlewares);

    // Fallback: alle Nicht-/api Routen -> index.html via Vite
    app.use(async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) return next();
      try {
        const html = await vite.transformIndexHtml(req.originalUrl, `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0b1020" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="icon" href="/icon-192.png" />
    <title>Focus Coach</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
        res.status(200).setHeader('Content-Type', 'text/html').end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const dist = path.resolve(__dirname, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(PORT, () => {
    console.log(`Dev server up on http://localhost:${PORT}`);
  });
}

start();