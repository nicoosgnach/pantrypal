import { z } from "zod";

export const MAX_ITEMS = 50;
export const MAX_ITEM_CHARS = 80;

const itemList = z
  .array(z.string().trim().min(1).max(MAX_ITEM_CHARS))
  .max(MAX_ITEMS)
  .default([]);

// Per-session kitchen profile. Deliberately has no field for medical
// conditions (see SCOPING.md / legal rules).
export const KitchenProfileSchema = z.object({
  equipment: itemList,
  ingredients: itemList,
  preferences: itemList,
  avoidAllergens: itemList,
});

export type KitchenProfile = z.infer<typeof KitchenProfileSchema>;
export type ProfileField = keyof KitchenProfile;
export type ProfileAdditions = Partial<Record<ProfileField, string[]>>;

export const PROFILE_FIELDS: { key: ProfileField; label: string }[] = [
  { key: "equipment", label: "Equipment" },
  { key: "ingredients", label: "Ingredients on hand" },
  { key: "preferences", label: "Preferences" },
  { key: "avoidAllergens", label: "Allergens to avoid" },
];

export const emptyProfile: KitchenProfile = {
  equipment: [],
  ingredients: [],
  preferences: [],
  avoidAllergens: [],
};

// Adds items to each list: trimmed, case-insensitively deduped, capped.
export function mergeProfile(
  profile: KitchenProfile,
  additions: ProfileAdditions,
): KitchenProfile {
  const next = { ...profile };
  for (const { key } of PROFILE_FIELDS) {
    const merged = [...profile[key]];
    const seen = new Set(merged.map((item) => item.toLowerCase()));
    for (const raw of additions[key] ?? []) {
      const item = raw.trim().slice(0, MAX_ITEM_CHARS);
      if (!item || seen.has(item.toLowerCase())) continue;
      seen.add(item.toLowerCase());
      merged.push(item);
    }
    next[key] = merged.slice(0, MAX_ITEMS);
  }
  return next;
}
