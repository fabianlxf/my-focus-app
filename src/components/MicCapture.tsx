import { useEffect, useRef, useState } from "react";

function supportMime(types: string[]) {
  for (const t of types) if ((window as any).MediaRecorder?.isTypeSupported?.(t)) return t;
  return '';
}

export default function MicCapture() {
  const [rec, setRec] = useState<MediaRecorder|null>(null);
  const [busy, setBusy] = useState(false);
  const chunks = useRef<BlobPart[]>([]);
  const [result, setResult] = useState<{text?:string; icsUrl?:string; }|null>(null);

  useEffect(() => () => { try { rec?.stop(); } catch {} }, [rec]);

  const start = async () => {
    try {
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = supportMime(['audio/mp4', 'audio/webm']);
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      mr.ondataavailable = e => chunks.current.push(e.data);
      mr.onstop = async () => {
        setBusy(true);
        try {
          const blob = new Blob(chunks.current, { type: (mr as any).mimeType || 'audio/webm' });
          const fd = new FormData();
          fd.append('file', blob, ((mr as any).mimeType || '').includes('mp4') ? 'speech.m4a' : 'speech.webm');
          fd.append('userId','demo-user');
          fd.append('includeInputs','true');
          const res = await fetch('/api/plan/from-speech', { method:'POST', body: fd });
          const data = await res.json();
          setResult({ text: data.text, icsUrl: data.icsUrl });
        } catch (e) {
          alert('Upload/Plan fehlgeschlagen');
        } finally {
          setBusy(false);
        }
      };
      mr.start();
      setRec(mr);
    } catch (e) {
      alert('Mikrofon-Zugriff verweigert');
    }
  };

  const stop = () => { try { rec?.stop(); } finally { setRec(null); } };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={rec ? stop : start}
        className={`w-16 h-16 rounded-full ${rec ? 'bg-red-600 animate-pulse' : 'bg-indigo-600'} text-white flex items-center justify-center shadow-lg`}
        aria-label="Tagesplan per Sprache eingeben"
      >
        {rec ? '■' : '🎤'}
      </button>
      {busy ? <div className="text-white text-xs mt-2 text-center opacity-80">Erzeuge Plan…</div> : null}
      {result?.text ? (
        <div className="mt-2 max-w-xs text-center text-white/90 text-xs">
          <div className="opacity-80">Transkript:</div>
          <div className="line-clamp-3">{result.text}</div>
          {result.icsUrl ? (
            <div className="mt-1">
              <a className="text-sky-400 underline" href={result.icsUrl}>ICS herunterladen</a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}