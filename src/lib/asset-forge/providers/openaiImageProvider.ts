import OpenAI from "openai";
import type { ImageGenerationProvider } from "../types.js";

export class OpenAIImageProvider implements ImageGenerationProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: { apiKey?: string; model?: string } = {}) {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("No OpenAI API key is configured. Set OPENAI_API_KEY or use prompt-only mode.");
    }
    this.client = new OpenAI({ apiKey });
    this.model = options.model ?? "gpt-image-1";
  }

  async generateImage(request: {
    prompt: string;
    dimensions: string;
    format: string;
    transparentBackground?: boolean;
  }): Promise<{ imageBuffer: Buffer; model: string; revisedPrompt?: string }> {
    const response = await this.client.images.generate({
      model: this.model,
      prompt: request.prompt,
      size: normalizeOpenAIImageSize(request.dimensions),
      background: request.transparentBackground ? "transparent" : "auto",
    });
    const first = response.data?.[0];
    if (!first?.b64_json) {
      throw new Error("The image provider did not return image data.");
    }
    return {
      imageBuffer: Buffer.from(first.b64_json, "base64"),
      model: this.model,
      revisedPrompt: first.revised_prompt,
    };
  }
}

function normalizeOpenAIImageSize(dimensions: string): "1024x1024" | "1024x1536" | "1536x1024" {
  if (dimensions === "1024x1024" || dimensions === "1024x1536" || dimensions === "1536x1024") return dimensions;
  throw new Error(`OpenAI image generation supports 1024x1024, 1024x1536, or 1536x1024. Received ${dimensions}.`);
}
