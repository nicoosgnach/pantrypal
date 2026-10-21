import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { KitchenProfileSchema } from "@/lib/profile";
import { buildSystemPrompt } from "@/lib/prompt";
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

  const result = streamText({
    model: anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5"),
    system: buildSystemPrompt(profile),
    messages: await convertToModelMessages(body.messages),
    tools: { searchRecipes, updateKitchenProfile },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    onError: () => "Something went wrong while generating a response.",
  });
}
