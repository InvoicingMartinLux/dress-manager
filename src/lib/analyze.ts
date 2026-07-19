import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, PATTERNS, SEASONS } from "./db/schema";

export type AnalyzedGarment = {
  name: string;
  category: (typeof CATEGORIES)[number];
  subcategory: string;
  colors: { name: string; hex: string }[];
  pattern: (typeof PATTERNS)[number];
  formality: number;
  seasons: (typeof SEASONS)[number][];
};

const SCHEMA = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description:
        "Short human-friendly name for the item, e.g. 'Light blue oxford shirt'",
    },
    category: { type: "string", enum: [...CATEGORIES] },
    subcategory: {
      type: "string",
      description: "More specific type, e.g. 'jeans', 't-shirt', 'sneakers'",
    },
    colors: {
      type: "array",
      description:
        "The 1-3 dominant colors of the garment itself (ignore the background)",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Color name, e.g. 'navy blue'" },
          hex: {
            type: "string",
            description: "Approximate hex value, e.g. '#1a2b5c'",
          },
        },
        required: ["name", "hex"],
        additionalProperties: false,
      },
    },
    pattern: { type: "string", enum: [...PATTERNS] },
    formality: {
      type: "integer",
      enum: [1, 2, 3, 4, 5],
      description:
        "1 = very casual (gym wear), 3 = smart casual, 5 = formal (suit/evening)",
    },
    seasons: {
      type: "array",
      items: { type: "string", enum: [...SEASONS] },
      description: "Seasons this garment is suitable for",
    },
  },
  required: [
    "name",
    "category",
    "subcategory",
    "colors",
    "pattern",
    "formality",
    "seasons",
  ],
  additionalProperties: false,
} as const;

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

let _client: Anthropic | null = null;
function client() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic();
  }
  return _client;
}

/** Analyze a clothing photo with Claude vision and return structured attributes. */
export async function analyzeGarmentImage(
  imageBase64: string,
  mediaType: ImageMediaType
): Promise<AnalyzedGarment> {
  const response = await client().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    output_config: {
      format: { type: "json_schema", schema: SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Analyze the clothing item in this photo for a digital wardrobe app. Identify its attributes precisely. If multiple items are visible, describe the most prominent one.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The image could not be analyzed");
  }
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No analysis returned");
  }
  return JSON.parse(text.text) as AnalyzedGarment;
}
