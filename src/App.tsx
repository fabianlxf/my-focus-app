import React, { useState } from "react";
import SpeechInput from "./components/SpeechInput";
import { generateDayPlan } from "./services/aiProxy";

type Page = "home" | "gallery" | "reports";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [posterVisible, setPosterVisible] = useState(true);
  const [dayPlan, setDayPlan] = useState<any[]>([]);

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
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4">„The World is Yours“</h1>
            {/* Master Flame */}
            <div className="w-16 h-16 rounded-full bg-orange-500 animate-pulse flex items-center justify-center">
              🔥
            </div>
            <p className="mt-4 opacity-80">Wische nach oben, um fortzufahren</p>
          </div>
          <div
            className="absolute inset-0"
            onClick={() => setPosterVisible(false)}
          ></div>
        </div>
      )}

      {/* Main Pages */}
      <div className="relative z-10 min-h-screen pb-20 p-4">
        {currentPage === "home" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Dein Dashboard</h2>
            {dayPlan.length > 0 ? (
              <ul className="space-y-2">
                {dayPlan.map((event, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg bg-gray-800 flex flex-col"
                  >
                    <span className="font-bold">{event.title}</span>
                    <span className="text-sm opacity-70">
                      {event.start} – {event.end}
                    </span>
                    <span className="text-sm text-blue-400">
                      {event.category}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="opacity-70">Noch kein Plan erstellt.</p>
            )}
          </div>
        )}

        {currentPage === "gallery" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Poster Galerie</h2>
            <p className="opacity-70">Hier erscheinen alle bisherigen Poster.</p>
          </div>
        )}

        {currentPage === "reports" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Wochenreport</h2>
            <p className="opacity-70">
              Übersicht deiner Flammen und Kategorien.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-black/80 border-t border-gray-700 flex justify-around items-center h-16 z-20">
        <button
          onClick={() => setCurrentPage("home")}
          className={`flex-1 h-full ${currentPage === "home" ? "bg-gray-800" : ""
            }`}
        >
          🏠
        </button>
        <button
          onClick={() => setCurrentPage("gallery")}
          className={`flex-1 h-full ${currentPage === "gallery" ? "bg-gray-800" : ""
            }`}
        >
          🖼️
        </button>
        <button
          onClick={() => setCurrentPage("reports")}
          className={`flex-1 h-full ${currentPage === "reports" ? "bg-gray-800" : ""
            }`}
        >
          📊
        </button>
      </div>

      {/* Speech Input Button */}
      <SpeechInput
        onResult={async (text) => {
          console.log("Speech result:", text);
          try {
            const plan = await generateDayPlan(text);
            console.log("Generated plan:", plan);
            setDayPlan(plan.events || []);
            alert(
              "Dein Plan für morgen wurde erstellt!\nSchau ins Dashboard 👆"
            );
          } catch (e) {
            alert("Fehler beim Erstellen des Plans.");
          }
        }}
      />
    </div>
  );
}

export default App;