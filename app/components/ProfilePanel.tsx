"use client";

import { useState } from "react";
import {
  emptyProfile,
  mergeProfile,
  PROFILE_FIELDS,
  type KitchenProfile,
  type ProfileField,
} from "@/lib/profile";

function FieldEditor({
  label,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <ul className="mt-1 flex flex-wrap gap-1">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5 text-sm dark:bg-zinc-700"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onRemove(item)}
              className="text-zinc-500 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onAdd(draft);
          setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add and press Enter"
          className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </form>
    </div>
  );
}

export function ProfilePanel({
  profile,
  onChange,
}: {
  profile: KitchenProfile;
  onChange: (profile: KitchenProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const count = PROFILE_FIELDS.reduce((n, f) => n + profile[f.key].length, 0);

  const remove = (key: ProfileField, item: string) =>
    onChange({ ...profile, [key]: profile[key].filter((i) => i !== item) });

  return (
    <section className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
      >
        <span>My kitchen ({count} {count === 1 ? "item" : "items"})</span>
        <span aria-hidden>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Saved for this session only. PantryPal also adds things you mention
            in chat. Health conditions are never saved.
          </p>
          {PROFILE_FIELDS.map(({ key, label }) => (
            <FieldEditor
              key={key}
              label={label}
              items={profile[key]}
              onAdd={(item) => onChange(mergeProfile(profile, { [key]: [item] }))}
              onRemove={(item) => remove(key, item)}
            />
          ))}
          <button
            type="button"
            onClick={() => onChange(emptyProfile)}
            className="text-sm text-red-600 hover:underline"
          >
            Clear profile
          </button>
        </div>
      )}
    </section>
  );
}
