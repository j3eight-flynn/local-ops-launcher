import { createAssetForgeService } from "./service.js";
import type { AssetRequest, GenerateAssetResult, ImageGenerationProvider } from "./types.js";

export async function generateAsset(
  rootDir: string,
  request: AssetRequest,
  provider?: ImageGenerationProvider,
): Promise<GenerateAssetResult> {
  return createAssetForgeService({ rootDir, generator: provider }).generateAsset(request);
}

export async function generateAssetPack(
  rootDir: string,
  request: AssetRequest & { packTitle?: string; consistencyNotes?: string },
  provider?: ImageGenerationProvider,
): Promise<GenerateAssetResult[]> {
  return createAssetForgeService({ rootDir, generator: provider }).generateAssetPack(request);
}

export function parseDimensions(dimensions: string): { width: number; height: number } {
  const match = dimensions.match(/^(\d+)x(\d+)$/);
  if (!match) throw new Error(`Unsupported dimensions "${dimensions}". Use WIDTHxHEIGHT, for example 1024x1536.`);
  return { width: Number(match[1]), height: Number(match[2]) };
}
