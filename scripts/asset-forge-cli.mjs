#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rootDir = process.cwd();
const command = process.argv[2] || "help";
const args = parseArgs(process.argv.slice(3));

const defaultConfig = {
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
  styleBiblePath: "/asset-forge/style-bible.md",
  promptRulesPath: "/asset-forge/prompt-rules.md",
  negativePromptsPath: "/asset-forge/negative-prompts.md",
  assetTypesPath: "/asset-forge/asset-types.json",
  generationPresetsPath: "/asset-forge/generation-presets.json",
  reviewCriteriaPath: "/asset-forge/review-criteria.md"
};

const defaultAssetTypes = {
  character_portrait: { label: "Character Portrait", description: "Portrait or bust image of a character.", defaultDimensions: "1024x1536", transparentBackground: false, safeAreaRequired: false, defaultFolder: "characters/portraits" },
  full_body_character: { label: "Full Body Character", description: "Full body character art for profiles, cards, or selection screens.", defaultDimensions: "1024x1536", transparentBackground: true, safeAreaRequired: true, defaultFolder: "characters/full-body" },
  background_scene: { label: "Background Scene", description: "Wide scene or environment background.", defaultDimensions: "1536x1024", transparentBackground: false, safeAreaRequired: true, defaultFolder: "backgrounds" },
  card_art: { label: "Card Art", description: "Full-bleed art intended for use inside a card frame.", defaultDimensions: "1024x1536", transparentBackground: false, safeAreaRequired: true, defaultFolder: "cards/art" },
  card_back: { label: "Card Back", description: "Decorative card back design.", defaultDimensions: "1024x1536", transparentBackground: false, safeAreaRequired: false, defaultFolder: "cards/backs" },
  item_icon: { label: "Item Icon", description: "Small item icon with transparent background.", defaultDimensions: "1024x1024", transparentBackground: true, safeAreaRequired: false, defaultFolder: "icons/items" },
  resource_icon: { label: "Resource Icon", description: "Resource or currency icon.", defaultDimensions: "1024x1024", transparentBackground: true, safeAreaRequired: false, defaultFolder: "icons/resources" },
  building_icon: { label: "Building Icon", description: "Icon or small illustration for a building.", defaultDimensions: "1024x1024", transparentBackground: true, safeAreaRequired: false, defaultFolder: "icons/buildings" },
  terrain_tile: { label: "Terrain Tile", description: "Tileable or semi-tileable terrain image.", defaultDimensions: "1024x1024", transparentBackground: false, safeAreaRequired: false, defaultFolder: "terrain" },
  faction_banner: { label: "Faction Banner", description: "Banner, symbol, or crest for a faction.", defaultDimensions: "1024x1024", transparentBackground: true, safeAreaRequired: false, defaultFolder: "factions/banners" },
  ui_panel: { label: "UI Panel", description: "Decorative or functional UI panel background.", defaultDimensions: "1536x1024", transparentBackground: true, safeAreaRequired: true, defaultFolder: "ui/panels" },
  sprite: { label: "Sprite", description: "Single sprite or sprite concept asset.", defaultDimensions: "1024x1024", transparentBackground: true, safeAreaRequired: false, defaultFolder: "sprites" },
  sprite_sheet: { label: "Sprite Sheet", description: "Multi-frame sprite sheet for animation.", defaultDimensions: "1536x1536", transparentBackground: true, safeAreaRequired: false, defaultFolder: "sprites/sheets" },
  marketing_visual: { label: "Marketing Visual", description: "Promotional visual for launch pages, social posts, or campaign materials.", defaultDimensions: "1536x1024", transparentBackground: false, safeAreaRequired: true, defaultFolder: "marketing" },
  custom: { label: "Custom Asset", description: "Project-specific asset not covered by the built-in categories.", defaultDimensions: "1024x1024", transparentBackground: false, safeAreaRequired: false, defaultFolder: "custom" }
};

try {
  if (command === "install") await install();
  else if (command === "setup") await setup();
  else if (command === "request") await requestAsset();
  else if (command === "generate-pack") await requestAsset({ pack: true });
  else if (command === "import") await importAsset();
  else if (command === "list") await listAssets();
  else if (command === "approve") await updateStatus("approved");
  else if (command === "reject") await updateStatus("rejected");
  else if (command === "revise") await updateStatus("needs_revision");
  else if (command === "archive") await updateStatus("archived");
  else printHelp();
} catch (error) {
  console.error(`\nAsset Forge error: ${error.message}`);
  process.exitCode = 1;
}

async function setup() {
  const rl = readline.createInterface({ input, output });
  console.log("Asset Forge setup wizard\n");
  const answers = {};
  answers.projectName = await ask(rl, "Project name", args.projectName || "");
  answers.projectType = await ask(rl, "Project type (Game, Web app, Marketing site, Storytelling platform, Card game, Dashboard, Internal tool, Other)", args.projectType || "Other");
  answers.projectPurpose = await ask(rl, "Project core purpose", args.projectPurpose || "");
  answers.audience = await ask(rl, "Intended audience", args.audience || "");
  answers.emotionalTarget = await ask(rl, "What emotional experience should the visuals create?", args.emotionalTarget || "");
  answers.userFeeling = await ask(rl, "What should users feel when they see the assets?", args.userFeeling || "");
  answers.genre = await ask(rl, "Genre or genres", args.genre || "");
  answers.visualStyle = await ask(rl, "Desired art style", args.visualStyle || "");
  answers.realismLevel = await ask(rl, "Realistic, semi-realistic, stylized, symbolic, abstract, or cartooned?", args.realismLevel || "stylized");
  answers.dominantColors = await ask(rl, "Dominant colors", args.dominantColors || "");
  answers.avoidColors = await ask(rl, "Colors to avoid", args.avoidColors || "");
  answers.textures = await ask(rl, "Textures", args.textures || "");
  answers.references = await ask(rl, "Existing screenshots, logos, concept images, or references", args.references || "Use /public/assets/generated/references");
  answers.avoidStyles = await ask(rl, "Styles, artists, franchises, or aesthetics to avoid", args.avoidStyles || "Living artist imitation, protected IP, fan art");
  answers.assetKinds = await ask(rl, "Asset kinds needed", args.assetKinds || "Character portraits, backgrounds, icons, UI panels");
  answers.assetUses = await ask(rl, "Where assets will be used", args.assetUses || "");
  answers.productionReady = await ask(rl, "Production-ready or draft concept assets?", args.productionReady || "draft concept assets");
  answers.useDrafts = await ask(rl, "Should the app use draft assets, or only approved assets?", args.useDrafts || "only approved assets");
  answers.transparentBackgrounds = await ask(rl, "Transparent backgrounds for icons, sprites, or cutouts?", args.transparentBackgrounds || "yes when asset type requires it");
  answers.framework = await ask(rl, "Framework", args.framework || "Other");
  answers.assetRoot = await ask(rl, "Generated asset storage path", args.assetRoot || "/public/assets/generated");
  answers.commitAssets = await ask(rl, "Should generated assets be committed to the repository?", args.commitAssets || "ask per project");
  answers.formats = await ask(rl, "Required image formats", args.formats || "PNG, WEBP where useful");
  answers.dimensions = await ask(rl, "Standard dimensions", args.dimensions || "Use asset-type defaults");
  answers.createThumbnails = await ask(rl, "Create thumbnails?", args.createThumbnails || "yes");
  answers.compressImages = await ask(rl, "Compress images?", args.compressImages || "yes when production-ready");
  answers.metadataFiles = await ask(rl, "Generate metadata files?", args.metadataFiles || "yes");
  answers.storage = await ask(rl, "Local JSON manifest or database?", args.storage || "local JSON manifest");
  answers.database = await ask(rl, "If database is used, which one?", args.database || "none");
  answers.requireApproval = await ask(rl, "Require human approval before use?", args.requireApproval || "yes");
  answers.approvers = await ask(rl, "Who can approve assets?", args.approvers || "project owner");
  answers.keepRejected = await ask(rl, "Keep or delete rejected assets?", args.keepRejected || "keep");
  answers.preserveHistory = await ask(rl, "Preserve original generation history for revised versions?", args.preserveHistory || "yes");
  answers.compareVariations = await ask(rl, "Compare variations side-by-side?", args.compareVariations || "yes in UI-capable projects");
  answers.keepPrompt = await ask(rl, "Keep the prompt used for each asset?", args.keepPrompt || "yes");
  answers.tagsNotesUsage = await ask(rl, "Include tags, notes, and usage instructions?", args.tagsNotesUsage || "yes");
  rl.close();

  const config = {
    ...defaultConfig,
    projectName: answers.projectName,
    projectType: answers.projectType,
    projectPurpose: answers.projectPurpose,
    audience: answers.audience,
    defaultAssetRoot: normalizeProjectPath(answers.assetRoot),
    manifestPath: normalizeProjectPath(answers.assetRoot).replace(/\/generated$/, "") + "/asset-manifest.json",
    approvedOnlyInProduction: !answers.useDrafts.toLowerCase().includes("draft"),
    requireHumanApproval: answers.requireApproval.toLowerCase().startsWith("y"),
    createThumbnails: answers.createThumbnails.toLowerCase().startsWith("y")
  };

  await ensureBaseFiles(config);
  await writeJson(projectPath(config.manifestPath), { assets: [] }, false);
  await writeJson(projectPath("/asset-forge/asset-forge.config.json"), config, true);
  await writeJson(projectPath("/asset-forge/asset-types.json"), defaultAssetTypes, false);
  await writeJson(projectPath("/asset-forge/generation-presets.json"), {
    promptOnly: { label: "Prompt-only mode", provider: "none", model: "prompt-only", createsImage: false },
    openaiHighQuality: { label: "OpenAI high quality", provider: "openai", model: "gpt-image-1", quality: "high", createsImage: true }
  }, false);
  await writeText(projectPath("/asset-forge/style-bible.md"), styleBible(answers), true);
  await writeText(projectPath("/asset-forge/prompt-rules.md"), promptRules(), false);
  await writeText(projectPath("/asset-forge/negative-prompts.md"), negativePrompts(answers), true);
  await writeText(projectPath("/asset-forge/review-criteria.md"), reviewCriteria(answers), false);
  await writeJson(projectPath("/asset-forge/asset-forge-log.json"), { entries: [{ timestamp: new Date().toISOString(), action: "setup_completion", user: "local-user", details: `Completed setup for ${answers.projectName}.` }] }, false);
  console.log("\nAsset Forge setup complete.");
}

async function install() {
  const framework = await detectFramework();
  await ensureBaseFiles(defaultConfig);
  await writeJson(projectPath("/asset-forge/asset-forge.config.json"), defaultConfig, false);
  await writeJson(projectPath("/asset-forge/asset-types.json"), defaultAssetTypes, false);
  await writeJson(projectPath("/asset-forge/generation-presets.json"), {
    promptOnly: { label: "Prompt-only mode", provider: "none", model: "prompt-only", createsImage: false },
    openaiHighQuality: { label: "OpenAI high quality", provider: "openai", model: "gpt-image-1", quality: "high", createsImage: true }
  }, false);
  await writeText(projectPath("/asset-forge/style-bible.md"), styleBible({
    projectName: "Unconfigured project",
    projectPurpose: "Create reviewed project-specific visual assets.",
    audience: "Defined during setup",
    emotionalTarget: "Defined during setup",
    userFeeling: "Defined during setup",
    genre: "Defined during setup",
    visualStyle: "Defined during setup",
    realismLevel: "Defined during setup",
    dominantColors: "Defined during setup",
    avoidColors: "Defined during setup",
    textures: "Defined during setup",
    avoidStyles: "Living artist imitation, protected IP, fan art",
    references: "/public/assets/generated/references"
  }), false);
  await writeText(projectPath("/asset-forge/prompt-rules.md"), promptRules(), false);
  await writeText(projectPath("/asset-forge/negative-prompts.md"), negativePrompts({ avoidStyles: "Living artist imitation, protected IP, fan art", avoidColors: "Project-specific exclusions go here" }), false);
  await writeText(projectPath("/asset-forge/review-criteria.md"), reviewCriteria({ projectName: "this project", approvers: "project owner", keepRejected: "keep", preserveHistory: "yes" }), false);
  await writeJson(projectPath("/asset-forge/asset-forge-log.json"), { entries: [] }, false);
  await writeJson(projectPath(defaultConfig.manifestPath), { assets: [] }, false);
  await writeText(projectPath("/asset-forge/SETUP_CHECKLIST.md"), setupChecklist(framework), true);
  console.log(`Asset Forge installed for ${framework}. Run: node scripts/asset-forge-cli.mjs setup`);
}

async function requestAsset(options = {}) {
  const config = await loadConfig();
  const assetTypes = await loadAssetTypes(config);
  const title = args.title || required("--title is required");
  const assetType = args.type || args.assetType || "custom";
  const typeDefinition = assetTypes[assetType] || assetTypes.custom;
  const count = Number(args.count || 1);
  const packId = options.pack ? (args.packId || `pack_${crypto.randomUUID()}`) : (args.packId || "");
  const manifest = await loadManifest(config);
  const records = [];

  for (let index = 0; index < count; index += 1) {
    const concreteTitle = count === 1 ? title : `${title} ${index + 1}`;
    const prompt = buildPrompt(config, {
      title: concreteTitle,
      assetType,
      purpose: args.purpose || required("--purpose is required"),
      description: args.description || required("--description is required"),
      dimensions: args.dimensions || typeDefinition.defaultDimensions,
      transparentBackground: booleanArg(args.transparentBackground, typeDefinition.transparentBackground),
      safeAreaRequired: booleanArg(args.safeAreaRequired, typeDefinition.safeAreaRequired),
      styleOverride: args.styleOverride || "",
      genreOverride: args.genreOverride || "",
      colorNotes: args.colorNotes || "",
      compositionNotes: args.compositionNotes || "",
      technicalNotes: args.technicalNotes || ""
    });
    const id = `asset_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const fileName = safeFileName(config.projectName || "project", assetType, concreteTitle, now, 1, config.defaultImageFormat);
    const sourceRelative = `${config.defaultAssetRoot}/source/${typeDefinition.defaultFolder}/${fileName.replace(/\.[^.]+$/, ".prompt.txt")}`;
    await writeText(projectPath(sourceRelative), prompt, false);
    const record = {
      id,
      project: config.projectName,
      assetType,
      title: concreteTitle,
      description: args.description,
      status: "draft_prompt_only",
      tags: splitList(args.tags),
      styleProfile: config.styleBiblePath,
      prompt,
      negativePrompt: await readText(projectPath(config.negativePromptsPath), ""),
      model: "prompt-only",
      dimensions: args.dimensions || typeDefinition.defaultDimensions,
      format: config.defaultImageFormat,
      transparentBackground: booleanArg(args.transparentBackground, typeDefinition.transparentBackground),
      safeAreaRequired: booleanArg(args.safeAreaRequired, typeDefinition.safeAreaRequired),
      filePath: "",
      thumbnailPath: "",
      sourcePath: sourceRelative,
      createdAt: now,
      updatedAt: now,
      approvedAt: "",
      approvedBy: "",
      rejectedAt: "",
      rejectedReason: "",
      version: 1,
      parentAssetId: null,
      packId,
      usage: splitList(args.usage),
      notes: args.notes || ""
    };
    manifest.assets.push(record);
    records.push(record);
    await appendLog("asset_generation_prompt_only", id, `Created prompt-only asset ${concreteTitle}.`);
  }

  await writeJson(projectPath(config.manifestPath), manifest, true);
  console.log(`Created ${records.length} prompt-only asset record(s).`);
  if (packId) console.log(`Pack: ${packId}`);
  for (const record of records) console.log(`- ${record.id}: ${record.title} (${record.sourcePath})`);
}

async function importAsset() {
  const config = await loadConfig();
  const assetTypes = await loadAssetTypes(config);
  const sourceFilePath = args.file || args.sourceFilePath || required("--file is required");
  if (!path.isAbsolute(sourceFilePath)) throw new Error("Asset imports require an absolute --file path.");
  if (sourceFilePath.includes("..")) throw new Error("Unsafe import path.");
  const assetType = args.type || args.assetType || "custom";
  const typeDefinition = assetTypes[assetType] || assetTypes.custom;
  const status = args.status === "approved" ? "approved" : "draft";
  const title = args.title || path.basename(sourceFilePath, path.extname(sourceFilePath));
  const extension = path.extname(sourceFilePath).replace(/^\./, "").toLowerCase();
  const fileName = safeFileName(config.projectName || "project", assetType, title, new Date().toISOString(), 1, extension);
  const targetRelative = `${config.defaultAssetRoot}/${status}/${typeDefinition.defaultFolder}/${fileName}`;
  const targetPath = projectPath(targetRelative);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  try {
    await fs.stat(targetPath);
    throw new Error(`Asset Forge will not overwrite an existing file: ${targetRelative}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const data = await fs.readFile(sourceFilePath);
  await fs.writeFile(targetPath, data);
  const now = new Date().toISOString();
  const id = `asset_${crypto.randomUUID()}`;
  const manifest = await loadManifest(config);
  manifest.assets.push({
    id,
    project: config.projectName,
    assetType,
    title,
    description: args.description || args.purpose || title,
    status,
    tags: splitList(args.tags),
    styleProfile: config.styleBiblePath,
    prompt: "",
    negativePrompt: "",
    model: "external-import",
    dimensions: args.dimensions || typeDefinition.defaultDimensions,
    format: extension,
    transparentBackground: booleanArg(args.transparentBackground, typeDefinition.transparentBackground),
    safeAreaRequired: booleanArg(args.safeAreaRequired, typeDefinition.safeAreaRequired),
    filePath: targetRelative,
    thumbnailPath: "",
    sourcePath: "",
    createdAt: now,
    updatedAt: now,
    approvedAt: status === "approved" ? now : "",
    approvedBy: status === "approved" ? (args.user || "local-user") : "",
    rejectedAt: "",
    rejectedReason: "",
    version: 1,
    parentAssetId: null,
    provider: "external",
    generationMode: "imported",
    sourceKind: "imported",
    importedFrom: sourceFilePath,
    checksum: crypto.createHash("sha256").update(data).digest("hex"),
    usage: splitList(args.usage),
    notes: args.notes || ""
  });
  await writeJson(projectPath(config.manifestPath), manifest, true);
  await appendLog("asset_import", id, `Imported ${title}.`);
  console.log(`Imported ${title}: ${id}`);
}

async function listAssets() {
  const config = await loadConfig();
  const manifest = await loadManifest(config);
  const search = (args.search || "").toLowerCase();
  const rows = manifest.assets.filter((asset) => {
    if (args.status && asset.status !== args.status) return false;
    if (args.type && asset.assetType !== args.type) return false;
    if (args.tag && !asset.tags.includes(args.tag)) return false;
    if (search && !`${asset.title} ${asset.description} ${asset.tags.join(" ")}`.toLowerCase().includes(search)) return false;
    return true;
  });
  if (rows.length === 0) {
    console.log("No assets found.");
    return;
  }
  for (const asset of rows) {
    console.log(`${asset.id} | ${asset.status} | ${asset.assetType} | ${asset.title}`);
  }
}

async function updateStatus(status) {
  const config = await loadConfig();
  const id = args.id || required("--id is required");
  const manifest = await loadManifest(config);
  const asset = manifest.assets.find((item) => item.id === id);
  if (!asset) throw new Error(`No asset found with id ${id}.`);
  asset.status = status;
  asset.updatedAt = new Date().toISOString();
  if (status === "approved") {
    asset.approvedAt = asset.updatedAt;
    asset.approvedBy = args.user || "local-user";
  }
  if (status === "rejected") {
    asset.rejectedAt = asset.updatedAt;
    asset.rejectedReason = args.reason || "No reason provided.";
  }
  if (status === "needs_revision") {
    asset.notes = [asset.notes, args.notes || "Revision requested."].filter(Boolean).join("\n\n");
  }
  await writeJson(projectPath(config.manifestPath), manifest, true);
  await appendLog(status, id, args.reason || args.notes || `Updated status to ${status}.`);
  console.log(`${asset.title} is now ${status}.`);
}

async function ensureBaseFiles(config) {
  await fs.mkdir(projectPath("/asset-forge"), { recursive: true });
  for (const folder of ["draft", "approved", "rejected", "archived", "thumbnails", "source", "references"]) {
    await fs.mkdir(projectPath(`${config.defaultAssetRoot}/${folder}`), { recursive: true });
  }
  await fs.mkdir(path.dirname(projectPath(config.manifestPath)), { recursive: true });
}

async function detectFramework() {
  const packageJson = await readJson(projectPath("/package.json"), {});
  const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
  if (deps.next || await exists(projectPath("/next.config.js")) || await exists(projectPath("/next.config.mjs")) || await exists(projectPath("/next.config.ts"))) return "Next.js App Router or compatible Next.js project";
  if (deps.react) return "React project";
  return "framework-neutral project";
}

async function exists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadConfig() {
  return { ...defaultConfig, ...await readJson(projectPath("/asset-forge/asset-forge.config.json"), defaultConfig) };
}

async function loadAssetTypes(config) {
  return readJson(projectPath(config.assetTypesPath), defaultAssetTypes);
}

async function loadManifest(config) {
  return readJson(projectPath(config.manifestPath), { assets: [] });
}

function buildPrompt(config, request) {
  return [
    `Create a ${request.assetType.replaceAll("_", " ")} for the project "${config.projectName || "Unconfigured Project"}".`,
    `Intended use: ${request.purpose}.`,
    `Subject and visual description: ${request.description}.`,
    `Style: ${request.styleOverride || "Use the project Asset Forge style bible."}`,
    request.genreOverride ? `Genre: ${request.genreOverride}.` : "",
    request.colorNotes ? `Color notes: ${request.colorNotes}.` : "",
    `Composition: ${request.compositionNotes || "Clear, readable composition appropriate to the asset's use."}`,
    `Technical requirements: ${request.dimensions}, ${config.defaultImageFormat.toUpperCase()}, transparent background ${request.transparentBackground ? "required" : "not required"}, safe area ${request.safeAreaRequired ? "required" : "not required"}.`,
    request.technicalNotes ? `Additional technical notes: ${request.technicalNotes}.` : "",
    "No text unless explicitly requested, no logos, no watermarks, no fan art, no protected character, no living artist imitation, no random additions."
  ].filter(Boolean).join(" ");
}

function styleBible(answers) {
  return `# Asset Forge Style Bible

## Project Name

${answers.projectName}

## Project Purpose

${answers.projectPurpose}

## Audience

${answers.audience}

## Emotional Target

${answers.emotionalTarget}

Users should feel: ${answers.userFeeling}

## Genre

${answers.genre}

## Visual Style

${answers.visualStyle}

## Realism Level

${answers.realismLevel}

## Color Palette

Dominant colors: ${answers.dominantColors}

Avoid: ${answers.avoidColors}

## Texture Rules

${answers.textures}

## Lighting Rules

Lighting should reinforce ${answers.emotionalTarget || "the project mood"} and stay consistent across each asset pack.

## Composition Rules

Use clear silhouettes, readable subjects, and safe space when assets are used under interface overlays.

## Character Design Rules

Characters must fit ${answers.genre || "the project genre"} and avoid unrequested franchise, celebrity, or living-person likenesses.

## Environment Design Rules

Environments should communicate story function, place, and usable atmosphere without random visual clutter.

## UI Asset Rules

UI art should support legibility, predictable layout, and the project's existing interface conventions.

## Icon Rules

Icons must read at small sizes. Use transparent backgrounds where configured.

## Card Art Rules

Card art should be frame-aware and leave rules text to the application unless specifically requested.

## Background Art Rules

Backgrounds should preserve safe areas for overlays, dialogue, or foreground characters when required.

## Sprite Rules

Sprites should use consistent scale, clear silhouettes, and transparent backgrounds unless the project says otherwise.

## What To Avoid

${answers.avoidStyles}

## Approved Reference Assets

${answers.references}

## Examples of Strong Asset Prompts

Create a project-specific asset that names the project, asset type, intended use, style language, palette, lighting, composition, dimensions, format, background requirement, and negative instructions.

## Examples of Bad Asset Prompts

Make cool art. Make it in a famous living artist's style. Make an existing franchise character. Add lots of random details.
`;
}

function promptRules() {
  return `# Asset Forge Prompt Rules

Every generated prompt must include:

1. Project name
2. Asset type
3. Intended use
4. Style description
5. Genre language
6. Color palette
7. Lighting
8. Composition
9. Technical requirements
10. Negative instructions
11. Output format
12. Whether the asset needs transparent background
13. Whether the asset needs safe space for UI overlays
14. Whether text should be included or avoided

The agent must avoid:

- Unlicensed franchise references
- Requests to imitate living artists
- Protected IP style copying
- Overly vague prompts
- Conflicting style instructions
- Text-heavy images unless specifically requested
- Random additions not requested by the user
- Inconsistent art direction across an asset pack
`;
}

function negativePrompts(answers) {
  return `# Negative Prompt Rules

Avoid:

- Blurry image
- Distorted anatomy
- Extra limbs
- Extra fingers
- Cropped face unless requested
- Unreadable text
- Random logos
- Watermarks
- Modern objects in non-modern settings
- Inconsistent lighting
- Inconsistent style
- Overly glossy digital plastic look unless requested
- Neon colors unless part of the style bible
- Fan art
- Existing copyrighted characters
- Specific living artist imitation
- Private person likeness without permission
- Commercial logos or trademarked mascots
- ${answers.avoidStyles}
- Colors to avoid: ${answers.avoidColors}
`;
}

function reviewCriteria(answers) {
  return `# Asset Forge Review Criteria

Approve an asset only when it:

- Fits the ${answers.projectName} style bible.
- Matches the requested asset type, usage, dimensions, and technical constraints.
- Avoids protected IP, living artist imitation, random logos, and unwanted text.
- Is readable at its intended display size.
- Has a clear file path and complete manifest metadata.
- Does not introduce production risk for the app, game, or brand.

Approvers: ${answers.approvers}

Rejected assets: ${answers.keepRejected}

Revision history: ${answers.preserveHistory}
`;
}

function setupChecklist(framework) {
  return `# Asset Forge Setup Checklist

- Run \`asset-forge setup\` and complete the project style bible.
- Set \`ASSET_FORGE_ENABLED=true\` only when the host project is ready.
- Set \`ASSET_FORGE_GENERATION_ENABLED=true\` only on trusted server environments.
- Set \`ASSET_FORGE_ADMIN_TOKEN\` or wire a host app authorizer before exposing routes.
- Keep \`ASSET_FORGE_APPROVED_ONLY=true\` for production consumers.
- Store \`OPENAI_API_KEY\` server-side only.
- For Next.js projects, copy templates from \`templates/next-app-router\` into the host app.

Detected framework: ${framework}
`;
}

async function appendLog(action, assetId, details) {
  const logPath = projectPath("/asset-forge/asset-forge-log.json");
  const log = await readJson(logPath, { entries: [] });
  log.entries.push({ timestamp: new Date().toISOString(), action, assetId, user: args.user || "local-user", details });
  await writeJson(logPath, log, true);
}

async function ask(rl, question, defaultValue) {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await rl.question(`${question}${suffix}: `);
  return answer.trim() || defaultValue;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = "true";
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function splitList(value = "") {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function booleanArg(value, fallback) {
  if (value === undefined) return fallback;
  return ["true", "yes", "1"].includes(String(value).toLowerCase());
}

function normalizeProjectPath(value) {
  const clean = value.trim() || "/public/assets/generated";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function projectPath(relative) {
  if (relative.includes("..")) throw new Error(`Unsafe path: ${relative}`);
  return path.join(rootDir, relative.replace(/^\/+/, ""));
}

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "asset";
}

function safeFileName(projectName, assetType, title, isoDate, version, format) {
  const day = isoDate.slice(0, 10).replaceAll("-", "");
  return `${slugify(projectName)}_${slugify(assetType)}_${slugify(title)}_${day}_v${version}.${format.replace(/^\./, "")}`;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function readText(filePath, fallback) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(filePath, value, overwrite) {
  await writeText(filePath, `${JSON.stringify(value, null, 2)}\n`, overwrite);
}

async function writeText(filePath, value, overwrite) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (!overwrite) {
    try {
      await fs.stat(filePath);
      return;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  await fs.writeFile(filePath, value, "utf8");
}

function required(message) {
  throw new Error(message);
}

function printHelp() {
  console.log(`Asset Forge Agent

Commands:
  setup     Run the setup wizard and create project-specific config files.
  install   Create base files, folders, manifest, and setup checklist.
  request   Create prompt-only asset records and prompt files.
  generate-pack Create a prompt-only pack with a shared packId.
  import    Import an externally generated local image file.
  list      List manifest assets.
  approve   Mark an asset approved.
  reject    Mark an asset rejected.
  revise    Mark an asset needs_revision.
  archive   Mark an asset archived.

Examples:
  asset-forge setup
  asset-forge request --title "Fog Market Ledger-Keeper" --type character_portrait --purpose "NPC portrait" --description "Older harbor merchant"
  asset-forge list --status draft_prompt_only
  asset-forge approve --id asset_...
`);
}
