import { useRef, useState } from "react";

export default function SpeechInput({ onResult }: { onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && !!(window as any).webkitSpeechRecognition;

  const startListening = () => {
    if (!isSupported) {
      alert("Sprachaufnahme (Web Speech API) wird von diesem Browser nicht unterstützt. Öffne die App in Safari (iOS) oder wir schalten demnächst Whisper-Upload frei.");
      return;
    }
    const Rec = (window as any).webkitSpeechRecognition;
    const recog = new Rec();
    recognitionRef.current = recog;
    recog.lang = "de-DE";
    recog.continuous = false;
    recog.interimResults = true;

    let finalTranscript = "";
    recog.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
    };
    recog.onend = () => {
      setListening(false);
      const t = (finalTranscript || "").trim();
      if (t.length > 0) onResult(t);
    };
    try {
      setListening(true);
      recog.start();
    } catch {
      setListening(false);
      alert("Konnte Aufnahme nicht starten.");
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={listening ? stopListening : startListening}
        className={`w-16 h-16 rounded-full ${listening ? "bg-red-600 animate-pulse" : "bg-indigo-600"} text-white flex items-center justify-center shadow-lg`}
        aria-label="Tagesplan per Sprache eingeben"
      >
        {listening ? "■" : "🎤"}
      </button>
    </div>
  );
}