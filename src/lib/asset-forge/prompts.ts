import path from "node:path";
import type { AssetBrief, AssetForgeConfig, AssetRequest, AssetTypeDefinition, AssetTypeRegistry } from "./types.js";
import { loadAssetTypes, loadConfig, loadTextConfig } from "./config.js";
import { readJsonFile, projectPath } from "./files.js";

export function validateRequest(request: AssetRequest): string[] {
  const missing: string[] = [];
  if (!request.title) missing.push("asset title");
  if (!request.assetType) missing.push("asset type");
  if (!request.purpose) missing.push("intended use or purpose");
  if (!request.description) missing.push("visual description");
  if (!request.count || request.count < 1) missing.push("number of assets");
  return missing;
}

export async function createAssetBrief(rootDir: string, request: AssetRequest): Promise<AssetBrief> {
  const config = await loadConfig(rootDir);
  const assetTypes = await loadAssetTypes(rootDir, config);
  const typeDefinition = resolveAssetType(assetTypes, request.assetType);
  return {
    assetType: request.assetType,
    title: request.title,
    purpose: request.purpose,
    visualDescription: request.description,
    styleNotes: [
      request.genreOverride ? `Genre override: ${request.genreOverride}.` : "",
      request.styleOverride ? `Style override: ${request.styleOverride}.` : "",
      request.mood ? `Mood: ${request.mood}.` : "",
      request.colorNotes ? `Color notes: ${request.colorNotes}.` : "",
    ].filter(Boolean).join(" ") || "Use the project style bible.",
    composition: request.compositionNotes || "Use a clear, readable composition appropriate to the intended use.",
    technical: {
      dimensions: request.dimensions || typeDefinition.defaultDimensions,
      format: config.defaultImageFormat,
      transparentBackground: request.transparentBackground ?? typeDefinition.transparentBackground,
      safeAreaRequired: request.safeAreaRequired ?? typeDefinition.safeAreaRequired,
    },
  };
}

export async function createFinalPrompt(rootDir: string, brief: AssetBrief, request: AssetRequest): Promise<string> {
  const config = await loadConfig(rootDir);
  const [styleBible, negativePrompts] = await Promise.all([
    loadTextConfig(rootDir, config.styleBiblePath),
    loadTextConfig(rootDir, config.negativePromptsPath),
  ]);

  const styleSummary = summarizeStyleBible(styleBible);
  const textInstruction = request.technicalNotes?.toLowerCase().includes("text")
    ? "Include text only exactly as requested in the technical notes."
    : "No text, no captions, no logos, no watermarks.";

  return [
    `Create a ${brief.assetType.replaceAll("_", " ")} for the project "${config.projectName || "Unconfigured Project"}".`,
    `Intended use: ${brief.purpose}.`,
    `Subject and visual description: ${brief.visualDescription}.`,
    `Project style guidance: ${styleSummary}`,
    `Request style notes: ${brief.styleNotes}.`,
    `Composition: ${brief.composition}.`,
    `Technical requirements: ${brief.technical.dimensions}, ${brief.technical.format.toUpperCase()}, transparent background ${brief.technical.transparentBackground ? "required" : "not required"}, safe space for UI overlays ${brief.technical.safeAreaRequired ? "required" : "not required"}.`,
    request.technicalNotes ? `Additional technical notes: ${request.technicalNotes}.` : "",
    textInstruction,
    `Negative instructions: ${negativePrompts.replace(/\s+/g, " ").trim()}`,
  ].filter(Boolean).join(" ");
}

export async function createBatchBriefs(rootDir: string, request: AssetRequest): Promise<AssetBrief[]> {
  const count = Math.max(1, request.count || 1);
  const briefs: AssetBrief[] = [];
  for (let index = 0; index < count; index += 1) {
    briefs.push(await createAssetBrief(rootDir, {
      ...request,
      title: count === 1 ? request.title : `${request.title} ${index + 1}`,
      description: count === 1 ? request.description : `${request.description} Asset ${index + 1} of ${count}; keep the pack visually consistent while making this item distinct.`,
    }));
  }
  return briefs;
}

export async function loadPromptInputs(rootDir: string): Promise<{
  config: AssetForgeConfig;
  assetTypes: AssetTypeRegistry;
  styleBible: string;
  promptRules: string;
  negativePrompts: string;
}> {
  const config = await loadConfig(rootDir);
  const [assetTypes, styleBible, promptRules, negativePrompts] = await Promise.all([
    readJsonFile<AssetTypeRegistry>(projectPath(rootDir, config.assetTypesPath), {}),
    loadTextConfig(rootDir, config.styleBiblePath),
    loadTextConfig(rootDir, config.promptRulesPath),
    loadTextConfig(rootDir, config.negativePromptsPath),
  ]);
  return { config, assetTypes, styleBible, promptRules, negativePrompts };
}

export function resolveAssetType(registry: AssetTypeRegistry, assetType: string): AssetTypeDefinition {
  const definition = registry[assetType];
  if (!definition) {
    throw new Error(`Asset Forge does not know the asset type "${assetType}". Add it to asset-forge/asset-types.json or use "custom".`);
  }
  return definition;
}

function summarizeStyleBible(styleBible: string): string {
  return styleBible
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("# Asset Forge"))
    .slice(0, 36)
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 1400);
}
