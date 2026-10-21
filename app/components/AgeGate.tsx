"use client";

import { useState } from "react";

// Self-declared 13+ gate (see SCOPING.md assumptions). Not verification.
export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [underage, setUnderage] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">PantryPal</h1>
      {underage ? (
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Sorry, PantryPal is only for people 13 and older. Ask a parent or
          guardian to cook with you!
        </p>
      ) : (
        <>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Before we get cooking: are you 13 or older?
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md bg-blue-600 px-4 py-2 text-white"
            >
              Yes, I&apos;m 13 or older
            </button>
            <button
              type="button"
              onClick={() => setUnderage(true)}
              className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700"
            >
              No
            </button>
          </div>
        </>
      )}
    </div>
  );
}
