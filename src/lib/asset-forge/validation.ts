import { stat } from "node:fs/promises";
import path from "node:path";
import type { AssetForgeConfig, AssetRequest, AssetStatus, AssetTypeRegistry, ImportAssetRequest } from "./types.js";

const validStatuses: AssetStatus[] = ["draft", "draft_prompt_only", "needs_revision", "approved", "rejected", "archived"];
const idPattern = /^(asset|pack)_[a-zA-Z0-9-]+$/;
const dimensionsPattern = /^([1-9]\d{1,4})x([1-9]\d{1,4})$/;

export function assertAssetId(id: string): void {
  if (!idPattern.test(id)) {
    throw new Error("Asset Forge received an invalid asset ID.");
  }
}

export function assertAssetStatus(status: string): asserts status is AssetStatus {
  if (!validStatuses.includes(status as AssetStatus)) {
    throw new Error(`Asset Forge received an unsupported review status: ${status}`);
  }
}

export function assertDimensions(dimensions: string): void {
  const match = dimensions.match(dimensionsPattern);
  if (!match) throw new Error("Use dimensions in WIDTHxHEIGHT format, for example 1024x1536.");
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width > 4096 || height > 4096) {
    throw new Error("Asset Forge supports dimensions up to 4096x4096 for local asset safety.");
  }
}

export function assertImageFormat(config: AssetForgeConfig, format: string): void {
  const normalized = format.replace(/^\./, "").toLowerCase();
  const allowed = config.allowedImageFormats ?? ["png", "jpg", "jpeg", "webp"];
  if (!allowed.includes(normalized)) {
    throw new Error(`Asset Forge only accepts these image formats: ${allowed.join(", ")}.`);
  }
}

export function assertTags(tags: string[] = []): void {
  for (const tag of tags) {
    if (tag.length > 64 || !/^[a-zA-Z0-9 _.-]+$/.test(tag)) {
      throw new Error(`Asset Forge received an unsafe tag: ${tag}`);
    }
  }
}

export function assertAssetRequest(config: AssetForgeConfig, assetTypes: AssetTypeRegistry, request: AssetRequest): void {
  if (!request.title?.trim()) throw new Error("Asset Forge needs an asset title.");
  if (!request.purpose?.trim()) throw new Error("Asset Forge needs an intended use or purpose.");
  if (!request.description?.trim()) throw new Error("Asset Forge needs a visual description.");
  if (!assetTypes[request.assetType]) throw new Error(`Asset Forge does not know the asset type "${request.assetType}".`);
  if (!Number.isInteger(request.count) || request.count < 1 || request.count > 100) {
    throw new Error("Asset Forge asset count must be between 1 and 100.");
  }
  assertDimensions(request.dimensions || assetTypes[request.assetType].defaultDimensions);
  assertImageFormat(config, config.defaultImageFormat);
  assertTags(request.tags);
}

export async function assertImportRequest(
  config: AssetForgeConfig,
  assetTypes: AssetTypeRegistry,
  request: ImportAssetRequest,
): Promise<void> {
  if (!request.sourceFilePath || !path.isAbsolute(request.sourceFilePath)) {
    throw new Error("Asset Forge imports require an absolute source file path.");
  }
  if (request.sourceFilePath.includes("..")) {
    throw new Error("Asset Forge blocked an unsafe import path.");
  }
  if (!assetTypes[request.assetType]) throw new Error(`Asset Forge does not know the asset type "${request.assetType}".`);
  if (!request.title?.trim()) throw new Error("Asset Forge needs a title for imported assets.");
  if (!request.purpose?.trim()) throw new Error("Asset Forge needs an intended use for imported assets.");
  if (request.dimensions) assertDimensions(request.dimensions);
  assertTags(request.tags);
  const file = await stat(request.sourceFilePath);
  const maxUploadBytes = config.maxUploadBytes ?? 15 * 1024 * 1024;
  if (!file.isFile()) throw new Error("Asset Forge can only import image files.");
  if (file.size > maxUploadBytes) throw new Error(`Asset Forge imports are limited to ${Math.round(maxUploadBytes / 1024 / 1024)} MB.`);
  const extension = path.extname(request.sourceFilePath).replace(/^\./, "").toLowerCase();
  assertImageFormat(config, extension);
}

export function sanitizeNotes(value = "", maxLength = 5000): string {
  return value.trim().slice(0, maxLength);
}
