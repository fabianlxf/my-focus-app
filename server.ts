// server.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
  credentials: false
}));
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// In-Memory Store für Demo (beim Neustart leer)
const subscriptions = new Map<string, PushSubscription>(); // key = userId

/**
 * Healthcheck
 */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/**
 * POST /api/ai/suggestions
 * Body: { goals: [{ title, category, priority, progress, description }] }
 * Returns: { suggestions: [{ title, content, type, source, relevanceScore }] }
 */
app.post('/api/ai/suggestions', async (req, res) => {
  try {
    const goals = (req.body?.goals ?? []) as Array<any>;
    const goalsContext = goals.map(g =>
      `Goal: ${g.title} (${g.category}, ${g.priority} priority, ${g.progress}% complete) - ${g.description}`
    ).join('\n');

    // JSON-Schema -> garantiert parsebares JSON
    const schema = {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          minItems: 3,
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              type: { type: "string", enum: ["insight","suggestion","reminder"] },
              source: { type: "string" },
              relevanceScore: { type: "number" }
            },
            required: ["title","content","type","source","relevanceScore"],
            additionalProperties: false
          }
        }
      },
      required: ["suggestions"],
      additionalProperties: false
    };

    const r = await client.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_output_tokens: 800,
      input: [
        { role: "system", content: "You are an AI coach. Return ONLY valid JSON per schema. Use concise, research-backed advice with short sources." },
        { role: "user", content: `Based on these goals, provide 3-4 items (insights/book refs/research) to keep the user focused and motivated.\n\n${goalsContext}` }
      ]
    });

    // Responses API: output -> content -> text
    const node = r.output?.[0]?.content?.[0];
    const json = (node && (node as any).type === "output_text")
      ? JSON.parse((node as any).text)
      : { suggestions: [] };

    return res.json(json);
  } catch (e: any) {
    console.error('suggestions error', e?.response?.data ?? e);
    return res.status(500).json({ error: 'AI suggestions failed' });
  }
});

/**
 * POST /api/ai/analyze
 * Body: { goal: { title, category, priority, progress, description } }
 * Returns: { insight, nextStep }
 */
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const g = req.body?.goal ?? {};
    const schema = {
      type: "object",
      properties: {
        insight: { type: "string" },
        nextStep: { type: "string" }
      },
      required: ["insight", "nextStep"],
      additionalProperties: false
    };

    const r = await client.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_output_tokens: 200,
      input: [
        { role: "system", content: "You are a concise goal coach. Return ONLY valid JSON." },
        { role: "user", content: `Analyze this goal and progress and respond with one brief insight and one concrete next step.\nTitle: ${g.title}\nCategory: ${g.category}\nPriority: ${g.priority}\nProgress: ${g.progress}%\nDescription: ${g.description}` }
      ]
    });

    const node = r.output?.[0]?.content?.[0];
    const json = (node && (node as any).type === "output_text")
      ? JSON.parse((node as any).text)
      : { insight: "Keep going!", nextStep: "Break the next task into 10-minute step." };

    return res.json(json);
  } catch (e: any) {
    console.error('analyze error', e?.response?.data ?? e);
    return res.status(500).json({ error: 'AI analyze failed' });
  }
});

// Speichert eine Push-Subscription für einen User
app.post('/api/push/save-subscription', (req, res) => {
  const { userId, subscription } = req.body || {};
  if (!userId || !subscription) return res.status(400).json({ error: 'userId + subscription required' });
  subscriptions.set(userId, subscription);
  return res.json({ ok: true });
});

// Sendet eine Test-Push an den User
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
    return res.json({ ok: true });
  } catch (e) {
    console.error('push error', e);
    return res.status(500).json({ error: 'push failed' });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => console.log(`API up on http://localhost:${port}`));


