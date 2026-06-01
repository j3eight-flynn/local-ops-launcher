import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AssetForgeConfig, AssetTypeRegistry } from "./types.js";
import { ensureAssetFolders, projectPath, readJsonFile, writeJsonFile } from "./files.js";

export const defaultConfig: AssetForgeConfig = {
  projectName: "",
  projectType: "",
  projectPurpose: "",
  audience: "",
  defaultAssetRoot: "/public/assets/generated",
  manifestPath: "/public/assets/asset-manifest.json",
  approvedOnlyInProduction: true,
  requireHumanApproval: true,
  createThumbnails: true,
  defaultImageFormat: "png",
  defaultQuality: "high",
  maxUploadBytes: 15 * 1024 * 1024,
  allowedImageFormats: ["png", "jpg", "jpeg", "webp"],
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  storageAdapter: "local-json",
  styleBiblePath: "/asset-forge/style-bible.md",
  promptRulesPath: "/asset-forge/prompt-rules.md",
  negativePromptsPath: "/asset-forge/negative-prompts.md",
  assetTypesPath: "/asset-forge/asset-types.json",
  generationPresetsPath: "/asset-forge/generation-presets.json",
  reviewCriteriaPath: "/asset-forge/review-criteria.md",
};

export async function loadConfig(rootDir = process.cwd()): Promise<AssetForgeConfig> {
  const configPath = path.join(rootDir, "asset-forge", "asset-forge.config.json");
  const config = await readJsonFile<AssetForgeConfig>(configPath, defaultConfig);
  return validateConfig({ ...defaultConfig, ...config });
}

export function validateConfig(config: AssetForgeConfig): AssetForgeConfig {
  const requiredPaths = [
    config.defaultAssetRoot,
    config.manifestPath,
    config.styleBiblePath,
    config.promptRulesPath,
    config.negativePromptsPath,
    config.assetTypesPath,
  ];

  for (const value of requiredPaths) {
    if (!value.startsWith("/")) {
      throw new Error(`Asset Forge paths must be project-root absolute paths like /public/assets. Invalid path: ${value}`);
    }
    if (value.includes("..")) {
      throw new Error(`Asset Forge paths may not include path traversal: ${value}`);
    }
  }

  return config;
}

export async function saveConfig(rootDir: string, config: AssetForgeConfig): Promise<void> {
  const nextConfig = validateConfig({ ...defaultConfig, ...config });
  await ensureAssetFolders(rootDir, nextConfig);
  await writeJsonFile(path.join(rootDir, "asset-forge", "asset-forge.config.json"), nextConfig);
}

export function isAssetForgeEnabled(): boolean {
  return process.env.ASSET_FORGE_ENABLED !== "false";
}

export function isGenerationEnabled(): boolean {
  return process.env.ASSET_FORGE_ENABLED === "true"
    && process.env.ASSET_FORGE_GENERATION_ENABLED === "true"
    && Boolean(process.env.OPENAI_API_KEY);
}

export async function loadAssetTypes(rootDir: string, config: AssetForgeConfig): Promise<AssetTypeRegistry> {
  return readJsonFile<AssetTypeRegistry>(projectPath(rootDir, config.assetTypesPath), {});
}

export async function loadTextConfig(rootDir: string, configuredPath: string): Promise<string> {
  return readFile(projectPath(rootDir, configuredPath), "utf8");
}
