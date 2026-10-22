# PantryPal

PantryPal is a conversational cooking assistant for the "it's 6pm, I'm tired, what do I make?" moment. It suggests recipes and gives short, numbered, source-linked steps that fit what you actually have: your equipment, ingredients on hand, preferences, and allergens to avoid. If a recipe needs gear you don't own, it offers a workaround or a similar dish instead of just saying no.

Built with Next.js 16 (App Router), TypeScript, Tailwind v4, and the Vercel AI SDK v6 with Anthropic Claude models. Web search is done with Tavily.

See [SCOPING.md](SCOPING.md) for what's in and out of v1, and [TRADEOFFS.md](TRADEOFFS.md) for what was built and why.

## Setup

You need an [Anthropic API key](https://console.anthropic.com/) and a [Tavily API key](https://tavily.com/).

```bash
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY and TAVILY_API_KEY
```

### Run with Docker (Compose v2)

```bash
docker compose up --build
```

Open http://localhost:3000. Keys are passed to the container at runtime through `env_file: .env.local` and are never baked into the image.

### Run locally

Requires Node 22+.

```bash
npm install
npm run dev
```

Other scripts: `npm run build` (production build and type check), `npm run lint`, `npx tsc --noEmit`.

### Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | | LLM provider |
| `TAVILY_API_KEY` | yes* | | Recipe web search. *Without it, the app still runs and answers from model knowledge, labeled as unsourced. |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-5-5` | Strong model for recipe search and synthesis |
| `ANTHROPIC_FAST_MODEL` | no | `claude-haiku-5-5` | Cheap model for the router and simple requests |

## Architecture

```
Browser (app/page.tsx)                         Server (app/api/chat/route.ts)
┌───────────────────────────┐   POST /api/chat   ┌──────────────────────────────────────┐
│ Age gate (13+)            │  { messages,       │ 1. Validate body + profile (zod)     │
│ Kitchen profile panel ────┼──  profile }  ───► │ 2. classifyRequest → simple|complex  │
│ Chat + mic (Web Speech)   │                    │    (Haiku, generateObject)           │
│ Allergen notice per reply │ ◄── UI message ─── │ 3. streamText on Haiku or Sonnet     │
│ Merge tool output into    │     stream         │    tools: searchRecipes,             │
│ profile state             │                    │           updateKitchenProfile       │
└───────────────────────────┘                    │    stopWhen: stepCountIs(5)          │
                                                 └──────────────────────────────────────┘
```

### Chat route
[app/api/chat/route.ts](app/api/chat/route.ts) does the following on each request:

1. Validates the JSON body. It returns 400 for malformed JSON, a missing `messages` array, or an invalid `profile`.
2. Routes the request to a model (see Model routing below).
3. Builds the system prompt from the profile with `buildSystemPrompt(profile)` ([lib/prompt.ts](lib/prompt.ts)).
4. Streams the reply with `streamText`, returned as an AI SDK UI message stream.

The model decides which tools to call and when. There is no hardcoded tool sequence.

### Tools
- **`searchRecipes`** ([lib/tools/searchRecipes.ts](lib/tools/searchRecipes.ts)): calls Tavily and returns the top 5 results, with snippets trimmed to 500 characters and a 15s timeout. Results are labeled as untrusted third-party data. Failures come back as an `{ error }` result, so the model can tell the user instead of the request crashing.
- **`updateKitchenProfile`** ([lib/tools/updateKitchenProfile.ts](lib/tools/updateKitchenProfile.ts)): the model calls it when the user mentions equipment, ingredients, preferences, or allergens. It returns only the new items to add. Items matching a list of medical terms (diabetes, pregnancy, medication, and so on) are dropped on the server, as a backstop to the prompt rule. Medical conditions are never saved.

### Profile flow
The profile type is `{ equipment, ingredients, preferences, avoidAllergens }`, all string arrays. It's defined in [lib/profile.ts](lib/profile.ts) and deliberately has no medical field.

1. The profile lives in React state in the browser, for the current session only. Nothing is stored on the server.
2. Every request sends the current profile. The server validates it and adds it to the system prompt as a JSON-encoded, tagged block marked as user-provided data.
3. When a reply finishes, the client merges any `updateKitchenProfile` outputs into the profile state. The merge trims, dedupes case-insensitively, and caps each list at 50 items.
4. Users can add, remove, or clear items in the collapsible "My kitchen" panel.

### Model routing
[lib/router.ts](lib/router.ts) sends the last few turns to the fast model with `generateObject`, which classifies the request:

- **`simple`** (cooking Q&A, chit-chat, redirects) is answered by Haiku.
- **`complex`** (recipes, meal ideas, adaptations) is answered by the strong model.

The classifier has a 3s timeout and no retries. Any failure routes to the strong model. Each request logs one line with no message content:

```json
{"event":"model_route","route":"simple","model":"claude-haiku-5-5","classifierFallback":false,"classifyMs":412}
```

### Legal guardrails

| Rule | Where it's enforced |
|---|---|
| Allergen notice on every assistant message | UI ([AllergenNotice.tsx](app/components/AllergenNotice.tsx)), not model output, so it can't be dropped |
| No medical or therapeutic diet advice; generic acknowledgment and referral | System prompt; medical terms are never saved to the profile (server-side filter) |
| No "is this safe to eat" judgments; refer to USDA / FoodSafety.gov | System prompt |
| Never claim a recipe is allergen-safe | System prompt |
| Search results are untrusted data | Tool output labeling, system prompt, and the classifier prompt |
| 13+ only | Self-declared age gate in the UI ([AgeGate.tsx](app/components/AgeGate.tsx)) |

### Push-to-talk voice
[app/components/MicButton.tsx](app/components/MicButton.tsx) uses the browser's Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`):

- **Using it:** click the mic to start, then click again or stop talking to finish. The transcript goes into the input box so you can check it before pressing Send.
- **Requirements:** a Chromium browser (Chrome, Edge) or Safari, microphone permission, and localhost or HTTPS.
- **Where it runs:** client-side only, with no backend changes. Note that in Chrome the browser itself sends audio to Google for recognition.
- **Unsupported browsers:** the button is hidden, for example in Firefox.

## Example requests

The endpoint takes AI SDK v6 UI messages plus an optional `profile`. Fields left out of `profile` default to `[]`. The response is a streamed UI message stream (SSE), so use `curl -N` to see it arrive. Note the curl examples skip the age gate, which only exists in the UI.

**1. Simple cooking question (routes to the fast model):**

```bash
curl -N http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"What can I substitute for buttermilk?"}]}]}'
```

**2. Recipe with a kitchen profile (routes to the strong model and calls `searchRecipes`):**

```bash
curl -N http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"I want pad thai tonight"}]}],
       "profile":{"equipment":["hot plate","one saucepan"],"ingredients":["rice noodles","eggs"],"preferences":["spicy"],"avoidAllergens":["peanuts"]}}'
```

Expect a workaround for the missing wok, no peanuts, cited sources, and no claim that the dish is allergen-free.

**3. Profile update with a medical mention (calls `updateKitchenProfile`):**

```bash
curl -N http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"I just got an air fryer, I am diabetic, and I love Thai food. Any ideas?"}]}],
       "profile":{"equipment":[],"ingredients":[],"preferences":[],"avoidAllergens":[]}}'
```

In the stream, the `updateKitchenProfile` output should add "air fryer" and "Thai food" but not "diabetic". The reply should refer the user to a doctor or dietitian, without adapting recipes to the condition.

## Project layout

```
app/
  api/chat/route.ts        chat endpoint: validation, routing, streamText
  components/              AgeGate, AllergenNotice, MicButton, ProfilePanel
  page.tsx                 chat UI and profile state
lib/
  models.ts                fast / strong model setup
  profile.ts               profile schema and merge helper
  prompt.ts                system prompt (voice + legal rules)
  router.ts                simple/complex classifier
  tools/                   searchRecipes, updateKitchenProfile
```
