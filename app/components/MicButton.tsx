"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal Web Speech API types; lib.dom doesn't ship them.
type SpeechResultList = ArrayLike<{
  isFinal: boolean;
  0: { transcript: string };
}>;

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: SpeechResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

// Support never changes at runtime; false on the server so the button is
// absent from the prerender.
const noopSubscribe = () => () => {};
function useSpeechSupported() {
  return useSyncExternalStore(
    noopSubscribe,
    () => getRecognitionCtor() !== undefined,
    () => false,
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked.",
  "service-not-allowed": "Microphone access was blocked.",
  "no-speech": "Didn't catch that. Try again?",
  "audio-capture": "No microphone found.",
  network: "Voice input needs a network connection.",
};

// Push-to-talk: click to start, click again (or stop talking) to finish.
// The transcript is appended to the current input for the user to review.
export function MicButton({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const supported = useSpeechSupported();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);

  // Abort (not stop) when the chat becomes busy, e.g. the user hit Send while
  // still talking, so a late result can't refill the cleared input.
  useEffect(() => {
    if (disabled) recognitionRef.current?.abort();
  }, [disabled]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  if (!supported) return null;

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const base = value.trimEnd();
    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("")
        .trim();
      onChange(base && transcript ? `${base} ${transcript}` : base || transcript);
    };
    recognition.onerror = (e) => {
      if (e.error !== "aborted") {
        setError(ERROR_MESSAGES[e.error] ?? "Voice input stopped unexpectedly.");
      }
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setError(null);
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setError("Couldn't start voice input.");
    }
  };

  return (
    <div className="relative flex">
      <button
        type="button"
        onClick={() => (listening ? recognitionRef.current?.stop() : start())}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : "Speak your message"}
        title={listening ? "Stop listening" : "Speak your message"}
        className={
          listening
            ? "flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-sm text-white"
            : "rounded-md border border-zinc-300 px-3 py-2 disabled:opacity-50 dark:border-zinc-700"
        }
      >
        {listening ? (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />
            Listening…
          </>
        ) : (
          <span aria-hidden>🎤</span>
        )}
      </button>
      {error && !listening && (
        <p role="status" className="absolute bottom-full right-0 mb-1 whitespace-nowrap text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
