// server.ts – Ein-Port Dev-Server (Express + Vite-Middleware) + API + Push
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

// ---- OpenAI
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ---- Web Push
webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);
const subscriptions = new Map<string, PushSubscription>();

// ---- Helper
function tryParseJsonFromText(text?: string) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (block?.[1]) { try { return JSON.parse(block[1]); } catch {} }
  const obj = text.match(/\{[\s\S]*\}$/); if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  const arr = text.match(/\[[\s\S]*\]$/); if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  return null;
}

async function createServer() {
  // ---- API ROUTES ZUERST (damit /api/* sicher greift) ----

  // Health & Debug
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/debug/env', (_req, res) => {
    res.json({
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV || null
    });
  });

  // Suggestions (mit Mock-Schalter ?mock=1 und robustem Logging)
  app.post('/api/ai/suggestions', async (req, res) => {
    try {
      console.log('[POST] /api/ai/suggestions', { bodyKeys: Object.keys(req.body || {}) });

      const useMock =
        !process.env.OPENAI_API_KEY ||
        String(req.query.mock || '').toLowerCase() === '1';

      if (useMock) {
        return res.json({
          suggestions: [
            {
              title: 'Mini-Schritt jetzt',
              content: 'Starte mit 5 Minuten. Kleine Schritte schlagen Perfektion.',
              type: 'suggestion',
              source: 'Mock',
              relevanceScore: 0.9
            },
            {
              title: 'Buchtipp: Deep Work',
              content: 'Cal Newport – Fokus-System gegen Ablenkungen.',
              type: 'insight',
              source: 'Book',
              relevanceScore: 0.85
            },
            {
              title: 'Reminder: Review um 17:00',
              content: 'Reflektiere 1 Fortschritt, 1 Hindernis, 1 nächsten Schritt.',
              type: 'reminder',
              source: 'Mock',
              relevanceScore: 0.8
            }
          ]
        });
      }

      const goals = (req.body?.goals ?? []) as Array<any>;
      const goalsContext = goals.map(g =>
        `Goal: ${g.title} (${g.category}, ${g.priority} priority, ${g.progress}% complete) - ${g.description}`
      ).join('\n');

      const system =
        'You are an AI coach. Return a JSON object {"suggestions":[...]} with 3-4 items. ' +
        'Each item: {title, content, type("insight"/"suggestion"/"reminder"), source, relevanceScore}. Only output JSON.';
      const user = `Based on these goals, provide 3-4 items.\n\n${goalsContext}`;

      let suggestions: any[] = [];
      try {
        const r = await client.responses.create({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_output_tokens: 800,
          input: [
            { role: 'system', content: system },
            { role: 'user',   content: user }
          ]
        });
        const text = (r as any).output_text as string | undefined;
        const parsed = tryParseJsonFromText(text) ?? { suggestions: [] };
        suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
      } catch (aiErr: any) {
        console.error('[AI] suggestions error:', {
          name: aiErr?.name,
          status: aiErr?.status,
          message: aiErr?.message
        });
        suggestions = [];
      }

      const safe = suggestions.slice(0, 4).map((s: any) => ({
        title: String(s?.title ?? 'AI Insight'),
        content: String(s?.content ?? ''),
        type: (['insight','suggestion','reminder'].includes(String(s?.type)) ? s.type : 'insight'),
        source: String(s?.source ?? 'AI'),
        relevanceScore: Number.isFinite(Number(s?.relevanceScore)) ? Number(s.relevanceScore) : 0.8
      }));

      res.json({ suggestions: safe });
    } catch (e: any) {
      console.error('suggestions route fatal', e);
      res.status(500).json({ error: 'AI suggestions failed hard' });
    }
  });

  // Analyze (mit Logging + Fallback)
  app.post('/api/ai/analyze', async (req, res) => {
    try {
      console.log('[POST] /api/ai/analyze', { bodyKeys: Object.keys(req.body || {}) });

      const g = req.body?.goal ?? {};
      let out: any = null;

      try {
        const r = await client.responses.create({
          model: 'gpt-4o-mini',
          temperature: 0.6,
          max_output_tokens: 200,
          input: [
            { role: 'system', content: 'You are a concise goal coach. Return JSON {insight,nextStep} only.' },
            { role: 'user',   content: `Analyze: ${JSON.stringify(g)}` }
          ]
        });
        const text = (r as any).output_text as string | undefined;
        const parsed = tryParseJsonFromText(text) ?? {};
        out = {
          insight: parsed.insight ?? 'Keep going!',
          nextStep: parsed.nextStep ?? 'Break the next task into 10-minute steps.'
        };
      } catch (aiErr: any) {
        console.error('[AI] analyze error:', {
          name: aiErr?.name,
          status: aiErr?.status,
          message: aiErr?.message
        });
        out = {
          insight: 'Du machst Fortschritte. Weiter so!',
          nextStep: 'Formuliere einen 10-Minuten-Schritt und führe ihn heute aus.'
        };
      }

      res.json(out);
    } catch (e: any) {
      console.error('analyze route fatal', e);
      res.status(500).json({ error: 'AI analyze failed hard' });
    }
  });

  // Push
  app.post('/api/push/save-subscription', (req, res) => {
    const { userId, subscription } = req.body || {};
    if (!userId || !subscription) return res.status(400).json({ error: 'userId + subscription required' });
    subscriptions.set(userId, subscription);
    res.json({ ok: true });
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
      res.json({ ok: true });
    } catch (e) {
      console.error('push error', e);
      res.status(500).json({ error: 'push failed' });
    }
  });

  // ---- Vite-Dev-Middleware NACH den API-Routen (ein Port)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await (await import('vite')).createServer({
      root: process.cwd(),
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(__dirname, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Dev server up on http://localhost:${PORT}`);
  });
}

createServer();