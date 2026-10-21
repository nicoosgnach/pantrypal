import { tool } from "ai";
import { z } from "zod";
import { MAX_ITEM_CHARS, type ProfileAdditions } from "@/lib/profile";

// Backstop for the prompt rule: health conditions must never be stored, even
// if the model tries. Matching items are dropped, not saved.
const MEDICAL_TERMS =
  /\b(diabet\w*|pre-?diabet\w*|insulin|pregnan\w*|gestational|celiac|coeliac|kidney|renal|hypertension|blood pressure|cholesterol|heart (disease|condition)|cancer|chemo\w*|ibs|crohn\w*|colitis|gerd|acid reflux|pku|phenylketonuria|gout|epilep\w*|eating disorder|anorexi\w*|bulimi\w*|medicat\w*|prescri\w*|doctor|dietitian|condition|disease|disorder|syndrome)\b/i;

const items = z
  .array(z.string().trim().min(1).max(MAX_ITEM_CHARS))
  .max(20)
  .optional();

type UpdateOutput = { added: ProfileAdditions; dropped: number };

export const updateKitchenProfile = tool({
  description:
    "Save things the user tells you about their kitchen to their session profile: equipment they own, ingredients they have on hand, food preferences (cuisines, lifestyle diets like vegetarian, likes/dislikes), and allergens or ingredients to avoid. Call it whenever the user mentions any of these and they aren't already in the profile. Only include new items, in short form (e.g. 'air fryer', 'peanuts'). NEVER include medical or health conditions (diabetes, pregnancy, kidney disease, medications, etc.); those are not stored.",
  inputSchema: z.object({
    equipment: items.describe("Cookware and appliances the user has"),
    ingredients: items.describe("Ingredients the user has on hand"),
    preferences: items.describe(
      "Lifestyle food preferences, never medical conditions",
    ),
    avoidAllergens: items.describe(
      "Allergens or ingredients the user wants to avoid, e.g. 'shellfish'",
    ),
  }),
  execute: async (input): Promise<UpdateOutput> => {
    const added: ProfileAdditions = {};
    let dropped = 0;
    for (const key of [
      "equipment",
      "ingredients",
      "preferences",
      "avoidAllergens",
    ] as const) {
      const kept = (input[key] ?? []).filter((item) => {
        const medical = MEDICAL_TERMS.test(item);
        if (medical) dropped++;
        return !medical;
      });
      if (kept.length) added[key] = kept;
    }
    return { added, dropped };
  },
});
