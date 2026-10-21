import { z } from "zod";

const MAX_ITEMS = 50;
const MAX_ITEM_CHARS = 80;

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
