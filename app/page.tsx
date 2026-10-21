"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

type SearchOutput =
  | { results: { title: string; url: string; content: string }[] }
  | { error: string };

type WebSearchPart = {
  type: "tool-webSearch";
  toolCallId: string;
  state: string;
  input?: { query?: string };
  output?: SearchOutput;
  errorText?: string;
};

function WebSearchCall({ part }: { part: WebSearchPart }) {
  const query = part.input?.query ?? "";

  if (part.state === "output-error") {
    return <p className="text-sm text-red-600">Search failed: {part.errorText}</p>;
  }

  if (part.state !== "output-available" || !part.output) {
    return (
      <p className="text-sm text-zinc-500 animate-pulse">Searching: {query}...</p>
    );
  }

  if ("error" in part.output) {
    return <p className="text-sm text-red-600">{part.output.error}</p>;
  }

  return (
    <div className="text-sm">
      <p className="text-zinc-500">Searched: {query}</p>
      <ul className="mt-1 list-disc pl-5 space-y-0.5">
        {part.output.results.map((r) => (
          <li key={r.url}>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {r.title || r.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Chat() {
  // Fixed id: the default calls Math.random() during render, which breaks the
  // Cache Components prerender. A single-chat page doesn't need a unique id.
  const { messages, sendMessage, status, error } = useChat({ id: "chat" });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Web search chat</h1>

      <div className="flex-1 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-lg bg-blue-600 px-3 py-2 text-white"
                : "max-w-[85%] space-y-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800"
            }
          >
            {m.parts.map((part, i) => {
              if (part.type === "text") {
                return (
                  <p key={i} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                );
              }
              if (part.type === "tool-webSearch") {
                const p = part as unknown as WebSearchPart;
                return <WebSearchCall key={p.toolCallId} part={p} />;
              }
              return null;
            })}
          </div>
        ))}

        {status === "submitted" && (
          <p className="text-sm text-zinc-500 animate-pulse">Thinking...</p>
        )}
        {error && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}
      </div>

      <form
        className="sticky bottom-0 mt-4 flex gap-2 bg-background py-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || busy) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "Waiting for response..." : "Ask anything..."}
          disabled={busy}
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={busy || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
