// Rendered by the UI under every assistant message so the notice can never be
// dropped or reworded by the model (legal requirement).
export const ALLERGEN_NOTICE =
  "Always check ingredient labels for allergens. PantryPal can't guarantee a recipe is allergen-free.";

export function AllergenNotice() {
  return (
    <p role="note" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
      ⚠️ {ALLERGEN_NOTICE}
    </p>
  );
}
