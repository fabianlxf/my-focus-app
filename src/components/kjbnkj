import React, { useState } from "react";

export default function SpeechInput({ onResult }: { onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  let recognition: any;

  if ("webkitSpeechRecognition" in window) {
    recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "de-DE";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onend = () => {
      setListening(false);
      if (transcript.trim().length > 0) {
        onResult(transcript);
      }
    };
  }

  const startListening = () => {
    if (recognition) {
      setTranscript("");
      setListening(true);
      recognition.start();
    } else {
      alert("Speech Recognition wird in diesem Browser nicht unterstützt.");
    }
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2">
      <button
        onClick={startListening}
        className={`w-16 h-16 rounded-full ${
          listening ? "bg-red-500 animate-pulse" : "bg-blue-500"
        } text-white flex items-center justify-center shadow-lg`}
      >
        🎤
      </button>
    </div>
  );
}