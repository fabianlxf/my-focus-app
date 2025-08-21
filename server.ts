// server.ts – Express + Vite Middleware (ein Port für Frontend & API)
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

// OpenAI Client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Web Push
webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const subscriptions = new Map<string, PushSubscription>();

async function createServer() {
  // Dev: Vite als Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await (await import('vite')).createServer({
      root: process.cwd(),
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    // Prod: statische Dateien
    const dist = path.resolve(__dirname, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  // ---- API ----
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  function tryParseJsonFromText(text?: string) {
    if (!text) return null;
    try { return JSON.parse(text); } catch {}
    const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (block?.[1]) { try { return JSON.parse(block[1]); } catch {} }
    const obj = text.match(/\{[\s\S]*\}$/); if (obj) { try { return JSON.parse(obj[0]); } catch {} }
    const arr = text.match(/\[[\s\S]*\]$/); if (arr) { try { return JSON.parse(arr[0]); } catch {} }
    return null;
  }

  app.post('/api/ai/suggestions', async (req, res) => {
    try {
      const goals = (req.body?.goals ?? []) as Array<any>;
      const goalsContext = goals.map(g =>
        `Goal: ${g.title} (${g.category}, ${g.priority} priority, ${g.progress}% complete) - ${g.description}`
      ).join('\n');

      const system = [
        'You are an AI coach.',
        'Return a JSON object {"suggestions":[...]} with 3-4 items.',
        'Each item: {title, content, type("insight"/"suggestion"/"reminder"), source, relevanceScore}.',
        'Only output JSON. No prose.'
      ].join(' ');

      const user = `Based on these goals, provide 3-4 items.\n\n${goalsContext}`;

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
      res.json(parsed);
    } catch (e: any) {
      console.error('suggestions error', e?.response?.data ?? e);
      res.status(500).json({ error: 'AI suggestions failed' });
    }
  });

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const g = req.body?.goal ?? {};
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
      res.json({
        insight: parsed.insight ?? 'Keep going!',
        nextStep: parsed.nextStep ?? 'Break the next task into 10-minute steps.'
      });
    } catch (e: any) {
      console.error('analyze error', e?.response?.data ?? e);
      res.status(500).json({ error: 'AI analyze failed' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Dev server up on http://localhost:${PORT}`);
  });
}

createServer();// server.ts – Express + Vite Middleware (ein Port für Frontend & API)
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

// OpenAI Client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Web Push
webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const subscriptions = new Map<string, PushSubscription>();

async function createServer() {
  // Dev: Vite als Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await (await import('vite')).createServer({
      root: process.cwd(),
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    // Prod: statische Dateien
    const dist = path.resolve(__dirname, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  // ---- API ----
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  function tryParseJsonFromText(text?: string) {
    if (!text) return null;
    try { return JSON.parse(text); } catch {}
    const block = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (block?.[1]) { try { return JSON.parse(block[1]); } catch {} }
    const obj = text.match(/\{[\s\S]*\}$/); if (obj) { try { return JSON.parse(obj[0]); } catch {} }
    const arr = text.match(/\[[\s\S]*\]$/); if (arr) { try { return JSON.parse(arr[0]); } catch {} }
    return null;
  }

  app.post('/api/ai/suggestions', async (req, res) => {
    try {
      const goals = (req.body?.goals ?? []) as Array<any>;
      const goalsContext = goals.map(g =>
        `Goal: ${g.title} (${g.category}, ${g.priority} priority, ${g.progress}% complete) - ${g.description}`
      ).join('\n');

      const system = [
        'You are an AI coach.',
        'Return a JSON object {"suggestions":[...]} with 3-4 items.',
        'Each item: {title, content, type("insight"/"suggestion"/"reminder"), source, relevanceScore}.',
        'Only output JSON. No prose.'
      ].join(' ');

      const user = `Based on these goals, provide 3-4 items.\n\n${goalsContext}`;

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
      res.json(parsed);
    } catch (e: any) {
      console.error('suggestions error', e?.response?.data ?? e);
      res.status(500).json({ error: 'AI suggestions failed' });
    }
  });

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const g = req.body?.goal ?? {};
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
      res.json({
        insight: parsed.insight ?? 'Keep going!',
        nextStep: parsed.nextStep ?? 'Break the next task into 10-minute steps.'
      });
    } catch (e: any) {
      console.error('analyze error', e?.response?.data ?? e);
      res.status(500).json({ error: 'AI analyze failed' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Dev server up on http://localhost:${PORT}`);
  });
}

createServer();