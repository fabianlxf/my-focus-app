import React, { useEffect, useMemo, useState } from "react";
import SpeechInput from "./components/SpeechInput";
import { generateDayPlan } from "./services/aiProxy";
import FlameDashboard from "./components/FlameDashboard.tsx";

type Page = "home" | "gallery" | "reports";

type Category = {
  id: string;
  name: string;
  lastActiveISO?: string;
};

type PlanEvent = {
  title: string;
  start: string; // ISO
  end: string;   // ISO
  category?: string;
  location?: string;
};

const DEFAULT_CATS: Category[] = [
  { id: "fitness", name: "Fitness" },
  { id: "learning", name: "Lernen" },
  { id: "work", name: "Arbeit" },
  { id: "finance", name: "Finanzen" },
  { id: "creativity", name: "Kreativität" },
  { id: "social", name: "Soziales" },
  { id: "mind", name: "Achtsamkeit" },
  { id: "org", name: "Organisation" },
  { id: "character", name: "Charakter" },
  { id: "impact", name: "Impact" },
];

function getFlameState(lastActiveISO: string | undefined, graceHours: number, now: Date): "active" | "grace" | "cold" {
  if (!lastActiveISO) return "cold";
  
  const lastActive = new Date(lastActiveISO);
  const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  if (diffHours <= 24) return "active";
  if (diffHours <= 24 + graceHours) return "grace";
  return "cold";
}

const LOCAL_KEY_CATS = "app.categories.v1";
const LOCAL_KEY_POSTER_SHOWN = "app.posterShown.today.v1";

function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY_CATS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CATS;
}
function saveCategories(cats: Category[]) {
  try {
    localStorage.setItem(LOCAL_KEY_CATS, JSON.stringify(cats));
  } catch {}
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [posterVisible, setPosterVisible] = useState(true);
  const [dayPlan, setDayPlan] = useState<PlanEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>(loadCategories());
  const [graceHours] = useState<number>(10);

  // Poster heute nur einmal zeigen
  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(LOCAL_KEY_POSTER_SHOWN);
    if (last === todayKey) {
      setPosterVisible(false);
    } else {
      setPosterVisible(true);
      localStorage.setItem(LOCAL_KEY_POSTER_SHOWN, todayKey);
    }
  }, []);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  // Master-Percent Anzeige (aus FlameDashboard-Logik abgeleitet)
  const masterPercent = useMemo(() => {
    const now = new Date();
    const activeCount = categories.filter((c) => {
      const state = getFlameState(c.lastActiveISO, graceHours, now);
      return state === "active" || state === "grace";
    }).length;
    return Math.round((activeCount / Math.max(1, categories.length)) * 100);
  }, [categories, graceHours]);

  // Kategorien anhand des KI-Plans „anfeuern“
  function markCategoriesActiveFromPlan(events: PlanEvent[]) {
    const nowISO = new Date().toISOString();
    const found = new Set<string>();
    for (const ev of events) {
      const cat = (ev.category || "").trim();
      if (cat) found.add(cat);
    }
    if (found.size === 0) return;

    setCategories((prev) => {
      const next = [...prev];
      const idxById = new Map<string, number>();
      next.forEach((c, i) => idxById.set(c.id, i));

      for (const raw of found) {
        const id = slugify(raw);
        if (idxById.has(id)) {
          const i = idxById.get(id)!;
          next[i] = { ...next[i], lastActiveISO: nowISO };
        } else {
          next.push({ id, name: raw, lastActiveISO: nowISO }); // Custom-Kategorie
        }
      }
      return next;
    });
  }

  return (
    <div className="relative min-h-screen bg-gray-900 overflow-hidden text-white">
      {/* Poster Overlay */}
      {posterVisible && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          style={{
            backgroundImage: "url(/posters/today.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={() => setPosterVisible(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute inset-0"
            style={{ animation: "posterBreath 12s ease-in-out infinite" }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4 drop-shadow">„The World is Yours“</h1>
            {/* Master Flame */}
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center">
              <span className={`${masterPercent >= 80 ? "animate-pulse" : ""}`}>🔥</span>
            </div>
            <div className="mt-1 text-sm opacity-90">{masterPercent}%</div>
            <p className="mt-4 opacity-80 text-sm">Tippen / wischen zum Fortfahren</p>
          </div>

          <style>
            {`@keyframes posterBreath {
              0% { transform: scale(1.02); }
              50% { transform: scale(1.06); }
              100% { transform: scale(1.02); }
            }`}
          </style>
        </div>
      )}

      {/* Main Pages */}
      <div className="relative z-10 min-h-screen pb-20 p-4">
        {currentPage === "home" && (
          <div className="space-y-4">
            {/* „Heute’s Input“ Kachel */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-sm opacity-80 mb-1">Heute’s Input</div>
              <button className="text-left w-full">
                <div className="text-base">Interessanter Fakt über Dschingis Khan →</div>
                <div className="text-xs opacity-70">
                  Weil du gerade viel über Aufbau/Skalierung sprichst.
                </div>
              </button>
            </div>

            {/* Flammen */}
            <FlameDashboard categories={categories} graceHours={graceHours} />

            {/* Geplanter Tagesplan */}
            {dayPlan.length > 0 ? (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Morgenplan</h2>
                <ul className="space-y-2">
                  {dayPlan.map((event, idx) => (
                    <li key={idx} className="p-3 rounded-lg bg-gray-800 flex flex-col">
                      <span className="font-bold">{event.title}</span>
                      <span className="text-sm opacity-70">
                        {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {event.category ? (
                        <span className="text-xs text-blue-300 mt-1">#{event.category}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {currentPage === "gallery" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Poster Galerie</h2>
            <p className="opacity-70">Hier erscheinen alle bisherigen Poster (Coming soon).</p>
          </div>
        )}

        {currentPage === "reports" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Wochenreport</h2>
            <p className="opacity-70">Übersicht deiner Flammen und Kategorien (Coming soon).</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-black/80 border-t border-gray-700 flex justify-around items-center h-16 z-20">
        <button
          onClick={() => setCurrentPage("home")}
          className={`flex-1 h-full ${currentPage === "home" ? "bg-gray-800" : ""}`}
        >
          🏠
        </button>
        <button
          onClick={() => setCurrentPage("gallery")}
          className={`flex-1 h-full ${currentPage === "gallery" ? "bg-gray-800" : ""}`}
        >
          🖼️
        </button>
        <button
          onClick={() => setCurrentPage("reports")}
          className={`flex-1 h-full ${currentPage === "reports" ? "bg-gray-800" : ""}`}
        >
          📊
        </button>
      </div>

      {/* Speech Input Button */}
      <SpeechInput
        onResult={async (text) => {
          try {
            const plan = await generateDayPlan(text);
            const events: PlanEvent[] = Array.isArray(plan?.events) ? plan.events : [];
            setDayPlan(events);
            // Kategorien aus dem Plan „anfeuern“
            markCategoriesActiveFromPlan(events);
            alert("Dein Plan für morgen wurde erstellt!");
          } catch {
            alert("Fehler beim Erstellen des Plans.");
          }
        }}
      />
    </div>
  );
}