import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import {
  FAST_MODEL_ID,
  fastModel,
  STRONG_MODEL_ID,
  strongModel,
} from "@/lib/models";
import { KitchenProfileSchema } from "@/lib/profile";
import { buildSystemPrompt } from "@/lib/prompt";
import { classifyRequest } from "@/lib/router";
import { searchRecipes } from "@/lib/tools/searchRecipes";
import { updateKitchenProfile } from "@/lib/tools/updateKitchenProfile";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { messages?: UIMessage[]; profile?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return Response.json({ error: "`messages` must be an array." }, { status: 400 });
  }

  let profile;
  if (body.profile !== undefined && body.profile !== null) {
    const parsed = KitchenProfileSchema.safeParse(body.profile);
    if (!parsed.success) {
      return Response.json(
        {
          error:
            "Invalid `profile`. Expected { equipment, ingredients, preferences, avoidAllergens } as string arrays.",
        },
        { status: 400 },
      );
    }
    profile = parsed.data;
  }

  const started = Date.now();
  const { route, fallback } = await classifyRequest(body.messages);
  const simple = route === "simple";
  // Routing metadata only; never log message content or keys.
  console.info(
    JSON.stringify({
      event: "model_route",
      route,
      model: simple ? FAST_MODEL_ID : STRONG_MODEL_ID,
      classifierFallback: fallback,
      classifyMs: Date.now() - started,
    }),
  );

  const result = streamText({
    model: simple ? fastModel : strongModel,
    system: buildSystemPrompt(profile),
    messages: await convertToModelMessages(body.messages),
    tools: { searchRecipes, updateKitchenProfile },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    onError: () => "Something went wrong while generating a response.",
  });
}
