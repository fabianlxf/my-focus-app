// server.ts – Express + Vite + OpenAI + WebPush + Speech->Plan + ICS + 22:00 Reminder
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { OpenAI } from 'openai';
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT ?? 1234);

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// --- OpenAI
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// --- WebPush
webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// In-Memory Stores
const subscriptions = new Map<string, PushSubscription>(); // userId -> sub
const dayTimers = new Map<string, NodeJS.Timeout[]>();     // userId -> timers

// Prefs (Reminder-Zeit, TZ)
type Prefs = { reminderHour: number; reminderMinute: number; tz: string };
const userPrefs = new Map<string, Prefs>();
function getUserPrefs(userId: string): Prefs {
  return userPrefs.get(userId) ?? { reminderHour: 22, reminderMinute: 0, tz: 'Europe/Berlin' };
}

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Push helpers
function schedulePushAt(userId: string, when: Date, payload: { title: string; description?: string }) {
  const delay = Math.max(0, when.getTime() - Date.now());
  const timers = dayTimers.get(userId) ?? [];
  const t = setTimeout(async () => {
    try {
      const sub = subscriptions.get(userId);
      if (!sub) return;
      await webpush.sendNotification(sub, JSON.stringify({
        title: `Bald: ${payload.title}`,
        body: (payload.description || 'Kleiner, klarer Startimpuls.').slice(0, 140),
        url: '/plan'
      }));
    } catch (e) {
      console.error('[push scheduled] error', e);
    }
  }, delay);
  timers.push(t);
  dayTimers.set(userId, timers);
}

function clearUserTimers(userId: string) {
  const old = dayTimers.get(userId) || [];
  old.forEach(clearTimeout);
  dayTimers.delete(userId);
}

// Save subscription
app.post('/api/push/save-subscription', (req, res) => {
  const { userId, subscription } = req.body || {};
  if (!userId || !subscription) return res.status(400).json({ error: 'userId + subscription required' });
  subscriptions.set(userId, subscription);
  return res.json({ ok: true });
});

// Manual push (debug)
app.post('/api/push/send', async (req, res) => {
  const { userId, title, body, url } = req.body || {};
  const sub = subscriptions.get(userId);
  if (!sub) return res.status(404).json({ error: 'no subscription for user' });
  try {
    await webpush.sendNotification(sub, JSON.stringify({
      title: title || 'Test',
      body: body || 'Hallo',
      url: url || '/'
    }));
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'push failed' }); }
});

// --- AI helper: Insight (optional)
async function generateOneInsight(goalLike: { title: string; description?: string }) {
  try {
    const r = await client.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_output_tokens: 250,
      input: [
        { role: 'system', content: 'Return ONLY JSON: {"title":"...","content":"..."} concise and practical.' },
        { role: 'user', content: `Create one focused insight:\n${JSON.stringify(goalLike)}` }
      ]
    });
    const text = (r as any).output_text as string | undefined;
    return JSON.parse(text ?? '{}');
  } catch {
    return { title: 'Focus', content: 'Take a clear 5-minute step now.' };
  }
}

// --- Planner types & state
type PlannedTask = {
  title: string;
  start: string;   // ISO
  end: string;     // ISO
  category?: string;
  location?: string;
  needsInput?: boolean;
  inputPrompts?: string[];
};
type NextDayPlan = {
  date: string;        // YYYY-MM-DD
  timezone?: string;
  tasks: PlannedTask[];
};
const plansByUser = new Map<string, NextDayPlan>();

// --- Planner (LLM)
async function generateNextDayPlan(
  userText: string,
  opts: { dayISO?: string; startHour?: number; endHour?: number; includeInputs?: boolean; tz?: string }
): Promise<NextDayPlan> {
  const day = opts.dayISO ?? new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10);
  const tz = opts.tz ?? 'Europe/Berlin';
  const startH = Number.isFinite(opts.startHour) ? opts.startHour! : 9;
  const endH   = Number.isFinite(opts.endHour)   ? opts.endHour!   : 18;

  const r = await client.responses.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_output_tokens: 900,
    input: [
      {
        role: 'system',
        content:
`You plan a realistic next-day schedule.
Return ONLY valid JSON with shape:
{
  "date":"YYYY-MM-DD",
  "timezone":"${tz}",
  "tasks":[
    {"title":"...", "start":"YYYY-MM-DDTHH:mm:00", "end":"YYYY-MM-DDTHH:mm:00",
     "category":"fitness|finances|learning|personal|work|creativity|social|mind|org|impact|other",
     "location":"...", "needsInput":true|false, "inputPrompts":["...","..."]}
  ]
}
Rules:
- Fit tasks into ${startH}:00–${endH}:00 (local).
- Respect fixed times mentioned by the user.
- Keep tasks atomic (30–120 min) and add short breaks.
- If includeInputs=false, set needsInput=false and omit inputPrompts.`
      },
      {
        role: 'user',
        content:
`Plan the next day based on this description:
Day: ${day}, Work window: ${startH}:00-${endH}:00, IncludeInputs=${!!opts.includeInputs}
User notes:\n${userText}`
      }
    ]
  });

  const text = (r as any).output_text as string | undefined;
  try {
    const json = JSON.parse(text ?? '{}');
    return {
      date: json.date ?? day,
      timezone: json.timezone ?? tz,
      tasks: Array.isArray(json.tasks) ? json.tasks : []
    };
  } catch {
    return { date: day, timezone: tz, tasks: [] };
  }
}

function schedulePlanPushes(userId: string, plan: NextDayPlan) {
  clearUserTimers(userId);
  for (const t of plan.tasks) {
    const startMs = new Date(t.start).getTime();
    const when = new Date(startMs - 10 * 60 * 1000); // 10 Min vorher
    schedulePushAt(userId, when, { title: t.title, description: t.inputPrompts?.[0] });
  }
}

// --- ICS
function pad2(n: number) { return n < 10 ? '0'+n : String(n); }
function toUtcBasic(d: Date) {
  return d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth()+1) +
    pad2(d.getUTCDate()) + 'T' +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) + 'Z';
}
function escapeICS(text: string) {
  return (text || '').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
}
function buildICS(userId: string, plan: NextDayPlan) {
  const now = new Date();
  const dtstamp = toUtcBasic(now);
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Focus Coach//EN',
    'CALSCALE:GREGORIAN'
  ];
  plan.tasks.forEach((t, idx) => {
    const uid = `${userId}-${plan.date}-${idx}@focuscoach`;
    const s = new Date(t.start);
    const e = new Date(t.end);
    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toUtcBasic(s)}`,
      `DTEND:${toUtcBasic(e)}`,
      `SUMMARY:${escapeICS(t.title)}`,
      t.location ? `LOCATION:${escapeICS(t.location)}` : '',
      t.needsInput && t.inputPrompts?.length ? `DESCRIPTION:${escapeICS(t.inputPrompts.join(' | '))}` : '',
      'END:VEVENT'
    );
  });
  ics.push('END:VCALENDAR');
  return ics.filter(Boolean).join('\r\n');
}

// --- STT
app.post('/api/stt', upload.single('file'), async (req, res) => {
  try {
    const buf = req.file?.buffer;
    const orig = req.file?.originalname || 'audio.webm';
    if (!buf) return res.status(400).json({ error: 'no audio' });

    const tmp = path.join(__dirname, `tmp-${Date.now()}-${orig}`);
    fs.writeFileSync(tmp, buf);

    const tr = await client.audio.transcriptions.create({
      file: fs.createReadStream(tmp) as any,
      model: 'whisper-1',
      language: 'de'
    });

    fs.unlinkSync(tmp);
    return res.json({ text: tr.text || '' });
  } catch (e) {
    console.error('[stt] error', e);
    return res.status(500).json({ error: 'stt failed' });
  }
});

// --- Audio -> Plan -> Nudges -> ICS
app.post('/api/plan/from-speech', upload.single('file'), async (req, res) => {
  try {
    const { userId = 'demo-user', includeInputs = 'true', startHour = '9', endHour = '18' } = req.body || {};
    if (!req.file) return res.status(400).json({ error: 'no audio' });

    const buf = req.file.buffer;
    const orig = req.file.originalname || 'speech.m4a';
    const tmp = path.join(__dirname, `tmp-${Date.now()}-${orig}`);
    fs.writeFileSync(tmp, buf);

    const tr = await client.audio.transcriptions.create({
      file: fs.createReadStream(tmp) as any,
      model: 'whisper-1',
      language: 'de'
    });
    fs.unlinkSync(tmp);
    const text = tr.text || '';

    const plan = await generateNextDayPlan(text, {
      includeInputs: includeInputs === 'true',
      startHour: Number(startHour),
      endHour: Number(endHour),
      tz: getUserPrefs(userId).tz
    });
    plansByUser.set(userId, plan);

    schedulePlanPushes(userId, plan);

    const icsUrl = `/api/plan/ics?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(plan.date)}`;
    return res.json({ text, plan, icsUrl });
  } catch (e) {
    console.error('[plan/from-speech] error', e);
    return res.status(500).json({ error: 'plan-from-speech failed' });
  }
});

// ICS download
app.get('/api/plan/ics', (req, res) => {
  const userId = String(req.query.userId || '');
  const date = String(req.query.date || '');
  if (!userId || !date) return res.status(400).send('userId and date required');
  const plan = plansByUser.get(userId);
  if (!plan || plan.date !== date) return res.status(404).send('plan not found');
  const ics = buildICS(userId, plan);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="plan-${date}.ics"`);
  res.send(ics);
});

// Reminder prefs
app.get('/api/reminder/prefs', (req, res) => {
  const userId = String(req.query.userId || 'demo-user');
  return res.json(getUserPrefs(userId));
});
app.post('/api/reminder/prefs', (req, res) => {
  const { userId = 'demo-user', hour = 22, minute = 0, tz = 'Europe/Berlin' } = req.body || {};
  userPrefs.set(userId, { reminderHour: Number(hour), reminderMinute: Number(minute), tz });
  res.json({ ok: true });
});

// Reminder Ticker (jede Minute)
setInterval(async () => {
  for (const [userId, sub] of subscriptions.entries()) {
    const prefs = getUserPrefs(userId);
    const now = new Date();
    if (now.getHours() === prefs.reminderHour && now.getMinutes() === prefs.reminderMinute) {
      try {
        await webpush.sendNotification(sub, JSON.stringify({
          title: 'Zeit für deinen Plan',
          body: 'Beschreibe jetzt deinen morgigen Tag. Ich trage alles ein.',
          url: '/plan'
        }));
      } catch { /* ignore */ }
    }
  }
}, 60 * 1000);

// --- Vite Dev / Static
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await (await import('vite')).createServer({
      root: process.cwd(),
      server: { middlewareMode: true, host: true, port: PORT }
    });
    app.use(vite.middlewares);

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
        (vite as any).ssrFixStacktrace?.(e as Error);
        next(e);
      }
    });
  } else {
    const dist = path.resolve(__dirname, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(PORT, () => console.log(`Dev server up on http://localhost:${PORT}`));
}
start();