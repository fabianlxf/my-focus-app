import React from "react";

export type Category = {
  id: string;          // slug, z.B. "fitness"
  name: string;        // Anzeige, z.B. "Fitness"
  lastActiveISO?: string; // zuletzt als aktiv geloggt (ISO)
};

export type FlameState = "active" | "grace" | "off";

export function getFlameState(
  lastActiveISO?: string,
  graceHours = 10,
  now: Date = new Date()
): FlameState {
  if (!lastActiveISO) return "off";
  const last = new Date(lastActiveISO);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfGrace = new Date(startOfToday.getTime() + (24 + graceHours) * 60 * 60 * 1000);

  // aktiv: heute geloggt
  if (last.getTime() >= startOfToday.getTime()) return "active";
  // grace: noch innerhalb 24h + grace nach Tageswechsel
  if (now.getTime() <= endOfGrace.getTime()) return "grace";
  return "off";
}

export default function FlameDashboard({
  categories,
  graceHours = 10,
}: {
  categories: Category[];
  graceHours?: number;
}) {
  const now = new Date();
  const states = categories.map((c) => ({
    ...c,
    state: getFlameState(c.lastActiveISO, graceHours, now),
  }));

  const activeCount = states.filter((c) => c.state === "active" || c.state === "grace").length;
  const masterPercent = Math.round((activeCount / Math.max(1, categories.length)) * 100);

  return (
    <div className="text-white">
      {/* Master Flame */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
          <span className={`${masterPercent >= 80 ? "animate-pulse" : ""}`}>🔥</span>
        </div>
        <div className="text-lg font-semibold">{masterPercent}% on fire</div>
      </div>

      {/* Kategorien */}
      <div className="grid grid-cols-2 gap-3">
        {states.map((c) => {
          const isActive = c.state === "active";
          const isGrace = c.state === "grace";
          return (
            <div
              key={c.id}
              className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  isActive ? "bg-orange-600/30" : isGrace ? "bg-amber-500/20" : "bg-black/40"
                }`}
              >
                <span>{isActive ? "🔥" : isGrace ? "✨" : "🕯️"}</span>
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs opacity-70">
                  {isActive ? "aktiv (heute)" : isGrace ? `glüht (≤ ${graceHours}h)` : "aus"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}