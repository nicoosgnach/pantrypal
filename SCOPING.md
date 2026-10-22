# SCOPING.md

## Scope committed
- **Kitchen-aware recipe assistant.** Recommends recipes and gives concise, step-by-step instructions synthesized from web search (with source links), tailored to the user's equipment, ingredients on hand, craving, stated preferences, and allergens to avoid.
- **Per-user kitchen profile (answer to the cookware problem).** No fixed starter kit. Users list their equipment in a profile panel or mention it in chat, and the model saves it via an `updateKitchenProfile` tool. Recipes are checked against it; if something is missing, the assistant offers a workaround or a similar recipe instead of just saying no.
- **General cooking help.** Techniques, doneness, substitutions; food-adjacent topics (wine pairing, gear, hosting) allowed; clearly off-topic requests get a friendly redirect.
- **Legal guardrails built into the format.** An allergen notice is rendered by the app on every assistant response (not left to the model). Medical conditions get a generic acknowledgment plus a referral to a professional, with no adaptation. "Is this safe to eat?" questions redirect to USDA/FoodSafety.gov. Self-declared 13+ age gate.
- **Opinionated, friendly voice.** Takes positions ("make this instead") without hedging; required notices live in the UI, not in the prose.
- **Streaming plus cost-aware routing.** Responses stream with visible tool status; simple questions go to a cheaper model, recipe search and synthesis to a stronger one.
- **Push-to-talk voice input.** A mic button transcribes speech into the input box using the browser's built-in speech recognition (Chrome/Safari); the user reviews the text before sending. Added after the core was working, as a first step toward Marcus's hands-free vision.

## Scope cut
- **Persistent cross-session memory.** Highest-value cut, but legal wants a retention and deletion story before we store anything health-adjacent (allergies included). V1 keeps the profile per session as a typed object, ready to persist once that story exists.
- **Adapting to medical diets** (diabetes, pregnancy, medically prescribed keto). Legal non-negotiable. Lifestyle preferences are still honored.
- **Always-on hands-free mode, read-aloud answers, favorites, grocery-list export, cookbook PDF import.** Real demand but v2. Push-to-talk is in; always-on listening raises privacy questions for legal, and the text-in/text-out API lets a full voice layer sit on top later.

## Contradictions resolved
- **Under 2s (Priya) vs. quality first (Marcus).** Stream so users see a response within ~2s, but never skip equipment or allergen checks to finish faster.
- **"Thread the needle" on health (Marcus) vs. no medical advice (Diane).** Legal wins: accommodate preferences and allergen exclusions, never medical conditions.
- **Generous topic scope (Marcus) vs. stay in lane (Priya).** Food-adjacent is in; food safety and health are out however food-adjacent that sound off-topic gets a warm redirect.
- **Personality (Marcus, Jordan) vs. required disclaimers (Diane).** Opinionated prose; notices in a consistent UI element so they're never dropped and never read as hedging.

## Clarifying questions
- Diane: exact wording for the allergen notice and health redirect, and can we store allergies (not conditions) if users can delete them?
- Priya: is "under 2 seconds" time to first response or full answer?
- Priya/Marcus: what's the per-conversation cost ceiling? It sets the routing thresholds.
- Diane: is a self-declared age gate sufficient for the COPPA stance?
- Diane: Chrome's speech recognition sends audio to Google's servers. Is that acceptable, or do we need a different speech provider before launch?

## Assumptions made
- A self-declared 13+ gate is enough for v1; no ID upload, since that adds privacy risk.
- Users describe their equipment accurately, and the profile is fully under their control.
- Web search returns recipes good enough to synthesize from, and sources are cited.
- One anonymous user per browser session; no accounts in v1.

## Risks accepted
- The model may misclassify a health condition as a preference, or be pushed by an adversarial prompt. Mitigated by prompt rules and adversarial testing, not guaranteed.
- Synthesized recipes may contain hidden allergens. Mitigated by the always-on notice; we never claim a recipe is allergen-safe.
- Web search results could contain prompt injection. They're treated as untrusted data, but the risk isn't eliminated.
- Session-only memory will frustrate returning users until persistence ships.
- Speech recognition can mishear words, including allergens. Mitigated by showing the transcript for review before sending, and by the always-on allergen notice.