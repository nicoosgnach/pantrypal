# SCOPING.md

## Scope committed
- **Kitchen-aware recipe assistant.** This tool recommends recipes and gives concise, step-by-step instructions synthesized from web search (with source links), tailored to the user's equipment, ingredients on hand, craving, stated preferences, and allergens to strictly avoid as mentioned multiple times by stakeholders in the brief.
- **Per-user kitchen profile (answer to the cookware problem).** Rather than having a fixed starter kit (and the issues associated with it mentioned by Jordan), users list their equipment in a profile panel or mention it in chat, and the model saves it via an `updateKitchenProfile` tool. Each time a recipe is found it is checked against it, if something is missing, PantryPal offers a workaround or a similar recipe instead of just saying no.
- **General cooking help.** Outside of just recipes it provides techniques, doneness, and substitutions, allowing food-adjacent topics (wine pairing, gear, hosting), but giving a friendly redirect to clearly off-topic requests.
- **Legal guardrails built into the format.** First of all, allergen notice is rendered by the app on every assistant response (not left to the model). Next, medical conditions get a generic acknowledgment plus a referral to a professional, with no adaptation. As instructed by Diane, to prioritize safety on the legal side of things "Is this safe to eat?" questions get redirected to USDA/FoodSafety.gov. Lastly, the 13+ age gate is self-declared in V1.
- **Opinionated, friendly voice.** To make it have a more "human feel" PantryPal takes positions ("make this instead") without hedging. To further this, required notices live in the UI, not in the prose.
- **Streaming plus cost-aware routing.** To begin addressing cost concerns posed by Priya, responses stream with visible tool status, with simple questions going to a cheaper model, and recipe search/synthesis to a stronger one.
- **Push-to-talk voice input.** To introduce part of the touchless loop indicated by Marcus, the mic button transcribes speech into the input box using the browser's built-in speech recognition (Chrome/Safari). To also prevent liability of an innaccurate transcription falling on us, the user reviews the text before sending. This was added after the core was working, as a first step toward Marcus's hands-free vision.

## Scope cut
- **Persistent cross-session memory.** Though this concern was voiced many times and is likely the highest-value cut, legal wants a retention and deletion story before we store anything health-adjacent (allergies included). Thus, V1 (at least) keeps the profile per session as a typed object, ready to persist once that story exists.
- **Adapting to medical diets** (diabetes, pregnancy, medically prescribed keto). These were legally non-negotiable, appeasing Diane's concerns, however lifestyle preferences are still honored, appeasing Marcus's direction.
- **Always-on hands-free mode, read-aloud answers, favorites, grocery-list export, cookbook PDF import.** Though this is a real demand, there's multiple obstacles that must be cleared first so saving this for V2. However, push-to-talk is at least in, as always-on listening raises privacy questions for legal, and the text-in/text-out API lets a full voice layer sit on top later.

## Contradictions resolved
- **Under 2s (Priya) vs. quality first (Marcus).** Outputs are streamed so users see a response within ~2s, but never skip equipment or allergen checks to finish faster (also partially addressing legal concerns).
- **"Thread the needle" on health (Marcus) vs. no medical advice (Diane).** To stay consistent with the legal safety approach: accommodate preferences and allergen exclusions, but never medical conditions, legal wins here.
- **Generous topic scope (Marcus) vs. stay in lane (Priya).** Food-adjacent requests, such as general recommendations, are in, however food safety and health are out, and food-adjacent that sound off-topic gets a warm redirect.
- **Personality (Marcus, Jordan) vs. required disclaimers (Diane).** To address both these issues but not make them mutually exclusive, prose are opinionated, while notices are in a consistent UI element so they're never dropped and never read as hedging.

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