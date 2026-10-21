"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useState } from "react";
import { AgeGate } from "@/app/components/AgeGate";
import { AllergenNotice } from "@/app/components/AllergenNotice";
import { ProfilePanel } from "@/app/components/ProfilePanel";
import {
  emptyProfile,
  mergeProfile,
  PROFILE_FIELDS,
  type KitchenProfile,
  type ProfileAdditions,
} from "@/lib/profile";

type SearchOutput =
  | { note?: string; results: { title: string; url: string; content: string }[] }
  | { error: string };

type SearchRecipesPart = {
  type: "tool-searchRecipes";
  toolCallId: string;
  state: string;
  input?: { query?: string };
  output?: SearchOutput;
  errorText?: string;
};

function SearchRecipesCall({ part }: { part: SearchRecipesPart }) {
  const query = part.input?.query ?? "";

  if (part.state === "output-error") {
    return <p className="text-sm text-red-600">Search failed: {part.errorText}</p>;
  }

  if (part.state !== "output-available" || !part.output) {
    return (
      <p className="text-sm text-zinc-500 animate-pulse">Finding recipes: {query}...</p>
    );
  }

  if ("error" in part.output) {
    return <p className="text-sm text-red-600">{part.output.error}</p>;
  }

  return (
    <div className="text-sm">
      <p className="text-zinc-500">Searched recipes: {query}</p>
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

type UpdateProfilePart = {
  type: "tool-updateKitchenProfile";
  toolCallId: string;
  state: string;
  output?: { added: ProfileAdditions; dropped: number };
};

function UpdateProfileCall({ part }: { part: UpdateProfilePart }) {
  if (part.state !== "output-available" || !part.output) {
    return <p className="text-sm text-zinc-500 animate-pulse">Updating your kitchen...</p>;
  }
  const added = PROFILE_FIELDS.flatMap((f) => part.output?.added[f.key] ?? []);
  return (
    <>
      {added.length > 0 && (
        <p className="text-sm text-zinc-500">Saved to your kitchen: {added.join(", ")}</p>
      )}
      {part.output.dropped > 0 && (
        <p className="text-sm text-zinc-500">Health details aren&apos;t saved.</p>
      )}
    </>
  );
}

// Applies every updateKitchenProfile result in a finished assistant message.
function profileAdditions(message: UIMessage): ProfileAdditions[] {
  return message.parts
    .filter((part) => part.type === "tool-updateKitchenProfile")
    .map((part) => part as unknown as UpdateProfilePart)
    .filter((p) => p.state === "output-available" && p.output)
    .map((p) => p.output!.added);
}

function Chat() {
  const [profile, setProfile] = useState<KitchenProfile>(emptyProfile);
  // Fixed id: the default calls Math.random() during render, which breaks the
  // Cache Components prerender. A single-chat page doesn't need a unique id.
  const { messages, sendMessage, status, error } = useChat({
    id: "chat",
    onFinish: ({ message }) => {
      const additions = profileAdditions(message);
      if (additions.length) {
        setProfile((p) => additions.reduce(mergeProfile, p));
      }
    },
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">PantryPal</h1>

      <ProfilePanel profile={profile} onChange={setProfile} />

      <div className="flex-1 space-y-4">
        {messages.map((m) =>
          m.role === "user" ? (
            <div
              key={m.id}
              className="ml-auto max-w-[85%] rounded-lg bg-blue-600 px-3 py-2 text-white"
            >
              {m.parts.map((part, i) =>
                part.type === "text" ? (
                  <p key={i} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                ) : null,
              )}
            </div>
          ) : (
            <div key={m.id} className="max-w-[85%]">
              <div className="space-y-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <p key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }
                  if (part.type === "tool-searchRecipes") {
                    const p = part as unknown as SearchRecipesPart;
                    return <SearchRecipesCall key={p.toolCallId} part={p} />;
                  }
                  if (part.type === "tool-updateKitchenProfile") {
                    const p = part as unknown as UpdateProfilePart;
                    return <UpdateProfileCall key={p.toolCallId} part={p} />;
                  }
                  return null;
                })}
              </div>
              <AllergenNotice />
            </div>
          ),
        )}

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
          sendMessage({ text: input }, { body: { profile } });
          setInput("");
        }}
      >
        <input
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "Waiting for response..." : "What are you in the mood to cook?"}
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

export default function Home() {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  return ageConfirmed ? <Chat /> : <AgeGate onConfirm={() => setAgeConfirmed(true)} />;
}
