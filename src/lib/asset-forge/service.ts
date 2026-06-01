import { randomUUID } from "node:crypto";
import path from "node:path";
import type {
  AssetForgeAuthorizer,
  AssetForgeConfig,
  AssetManifestAdapter,
  AssetRecord,
  AssetRequest,
  AssetStorageAdapter,
  AuditLogger,
  GenerateAssetResult,
  ImageGenerationProvider,
  ImportAssetRequest,
  ThumbnailProvider,
} from "./types.js";
import { defaultConfig, isGenerationEnabled, loadAssetTypes, loadConfig, saveConfig } from "./config.js";
import { LocalFileStorageAdapter } from "./adapters/localFileStorageAdapter.js";
import { LocalJsonManifestAdapter } from "./adapters/localJsonManifestAdapter.js";
import { LocalAuditLogger } from "./adapters/localAuditLogger.js";
import { SharpThumbnailProvider } from "./adapters/sharpThumbnailProvider.js";
import { createAssetId } from "./manifest.js";
import { createAssetBrief, createFinalPrompt, resolveAssetType } from "./prompts.js";
import { projectPath, safeFileName, slugify } from "./files.js";
import { assertAssetId, assertAssetRequest, assertImportRequest, sanitizeNotes } from "./validation.js";
import { filterAssets, type AssetSearchFilters } from "./search.js";

export interface AssetForgeServiceOptions {
  rootDir?: string;
  storage?: AssetStorageAdapter;
  manifest?: AssetManifestAdapter;
  generator?: ImageGenerationProvider;
  thumbnailer?: ThumbnailProvider;
  auditLogger?: AuditLogger;
  authorize?: AssetForgeAuthorizer;
}

export interface AssetForgeService {
  getConfig(): Promise<AssetForgeConfig>;
  setup(config: Partial<AssetForgeConfig>): Promise<AssetForgeConfig>;
  generateAsset(request: AssetRequest): Promise<GenerateAssetResult>;
  generateAssetPack(request: AssetRequest & { packTitle?: string; consistencyNotes?: string }): Promise<GenerateAssetResult[]>;
  importAsset(request: ImportAssetRequest, actor?: string): Promise<AssetRecord>;
  approveAsset(id: string, actor?: string): Promise<AssetRecord>;
  rejectAsset(id: string, reason: string, actor?: string): Promise<AssetRecord>;
  requestRevision(id: string, notes: string, actor?: string): Promise<AssetRecord>;
  archiveAsset(id: string, actor?: string): Promise<AssetRecord>;
  getAssetById(id: string): Promise<AssetRecord | undefined>;
  getApprovedAssets(filters?: AssetSearchFilters): Promise<AssetRecord[]>;
  searchAssets(filters?: AssetSearchFilters): Promise<AssetRecord[]>;
}

export function createAssetForgeService(options: AssetForgeServiceOptions = {}): AssetForgeService {
  const rootDir = options.rootDir ?? process.cwd();
  const storage = options.storage ?? new LocalFileStorageAdapter(rootDir);
  const manifest = options.manifest ?? new LocalJsonManifestAdapter(rootDir);
  const auditLogger = options.auditLogger ?? new LocalAuditLogger(rootDir);
  const thumbnailer = options.thumbnailer ?? new SharpThumbnailProvider();

  return {
    async getConfig() {
      return loadConfig(rootDir);
    },

    async setup(config) {
      const next = { ...defaultConfig, ...(await loadConfig(rootDir)), ...config };
      await saveConfig(rootDir, next);
      await storage.ensureBaseFolders(next);
      await auditLogger.log({ action: "setup_completion", user: "local-user", details: `Saved setup for ${next.projectName || "project"}.` });
      return next;
    },

    async generateAsset(request) {
      const config = await loadConfig(rootDir);
      const assetTypes = await loadAssetTypes(rootDir, config);
      assertAssetRequest(config, assetTypes, request);
      const typeDefinition = resolveAssetType(assetTypes, request.assetType);
      await storage.ensureAssetTypeFolders(config, typeDefinition);

      const brief = await createAssetBrief(rootDir, request);
      const prompt = await createFinalPrompt(rootDir, brief, request);
      const now = new Date().toISOString();
      const id = createAssetId();
      const imageFileName = safeFileName({
        projectName: config.projectName || "project",
        assetType: request.assetType,
        title: request.title,
        format: brief.technical.format,
      });
      const source = await storage.saveSourceText({
        config,
        typeDefinition,
        fileName: imageFileName.replace(/\.[^.]+$/, ".prompt.txt"),
        text: prompt,
      });

      let filePath = "";
      let checksum = "";
      let model = "prompt-only";
      let provider = "none";
      let generationMode: AssetRecord["generationMode"] = "prompt_only";
      let generatedImage = false;
      let message = "Asset Forge saved the brief and prompt in prompt-only mode.";

      if (options.generator && isGenerationEnabled()) {
        try {
          const image = await options.generator.generateImage({
            prompt,
            dimensions: brief.technical.dimensions,
            format: brief.technical.format,
            transparentBackground: brief.technical.transparentBackground,
          });
          const saved = await storage.saveDraftAsset({ config, typeDefinition, fileName: imageFileName, buffer: image.imageBuffer });
          filePath = saved.relativePath;
          checksum = saved.checksum ?? "";
          model = image.model;
          provider = "openai";
          generationMode = "generated";
          generatedImage = true;
          message = "Asset Forge generated an image and saved it as a draft.";
        } catch (error) {
          message = `Asset Forge could not generate the image because the provider failed. The brief and prompt were saved in prompt-only mode. ${(error as Error).message}`;
        }
      }

      const record: AssetRecord = {
        id,
        project: config.projectName,
        assetType: request.assetType,
        title: request.title,
        description: request.description,
        status: generatedImage ? "draft" : "draft_prompt_only",
        tags: request.tags ?? [],
        styleProfile: config.styleBiblePath,
        prompt,
        negativePrompt: "",
        model,
        dimensions: brief.technical.dimensions,
        format: brief.technical.format,
        transparentBackground: brief.technical.transparentBackground,
        safeAreaRequired: brief.technical.safeAreaRequired,
        filePath,
        thumbnailPath: "",
        sourcePath: source.relativePath,
        createdAt: now,
        updatedAt: now,
        approvedAt: "",
        approvedBy: "",
        rejectedAt: "",
        rejectedReason: "",
        version: 1,
        parentAssetId: null,
        packId: request.packId,
        provider,
        generationMode,
        sourceKind: generationMode === "generated" ? "generated" : "prompt_only",
        checksum,
        usage: request.usage ?? [],
        notes: sanitizeNotes(request.notes),
      };

      const added = await manifest.add(record);
      if (generatedImage && config.createThumbnails) {
        await createAndAttachThumbnail(rootDir, config, manifest, thumbnailer, added);
      }
      await auditLogger.log({ action: generatedImage ? "asset_generation" : "asset_generation_prompt_only", assetId: id, details: message });
      return { record: await manifest.findById(id) ?? added, brief, prompt, generatedImage, message };
    },

    async generateAssetPack(request) {
      const count = Math.max(1, request.count || 1);
      const packId = request.packId || `pack_${randomUUID()}`;
      const results: GenerateAssetResult[] = [];
      await auditLogger.log({ action: "pack_generation_started", assetId: packId, details: `Started pack ${request.packTitle || request.title} with ${count} assets.` });
      for (let index = 0; index < count; index += 1) {
        results.push(await this.generateAsset({
          ...request,
          count: 1,
          packId,
          title: count === 1 ? request.title : `${request.title} ${index + 1}`,
          description: [
            request.description,
            request.packTitle ? `Part of asset pack: ${request.packTitle}.` : "",
            request.consistencyNotes ? `Pack consistency notes: ${request.consistencyNotes}.` : "",
            count > 1 ? `This is item ${index + 1} of ${count}; keep it distinct while preserving visual consistency.` : "",
          ].filter(Boolean).join(" "),
        }));
      }
      await auditLogger.log({ action: "pack_generation_completed", assetId: packId, details: `Created ${results.length} assets.` });
      return results;
    },

    async importAsset(request, actor = "local-user") {
      const config = await loadConfig(rootDir);
      const assetTypes = await loadAssetTypes(rootDir, config);
      await assertImportRequest(config, assetTypes, request);
      const typeDefinition = resolveAssetType(assetTypes, request.assetType);
      await storage.ensureAssetTypeFolders(config, typeDefinition);

      const now = new Date().toISOString();
      const id = createAssetId();
      const extension = path.extname(request.sourceFilePath).replace(/^\./, "").toLowerCase();
      const fileName = safeFileName({
        projectName: config.projectName || "project",
        assetType: request.assetType,
        title: request.title,
        format: extension,
      });
      const status = request.status ?? "draft";
      const imported = await storage.importAssetFile({
        config,
        typeDefinition,
        sourceFilePath: request.sourceFilePath,
        fileName,
        status,
      });
      const record: AssetRecord = {
        id,
        project: config.projectName,
        assetType: request.assetType,
        title: request.title,
        description: request.description || request.purpose,
        status,
        tags: request.tags ?? [],
        styleProfile: config.styleBiblePath,
        prompt: "",
        negativePrompt: "",
        model: "external-import",
        dimensions: request.dimensions || typeDefinition.defaultDimensions,
        format: extension,
        transparentBackground: request.transparentBackground ?? typeDefinition.transparentBackground,
        safeAreaRequired: request.safeAreaRequired ?? typeDefinition.safeAreaRequired,
        filePath: imported.relativePath,
        thumbnailPath: "",
        sourcePath: "",
        createdAt: now,
        updatedAt: now,
        approvedAt: status === "approved" ? now : "",
        approvedBy: status === "approved" ? actor : "",
        rejectedAt: "",
        rejectedReason: "",
        version: 1,
        parentAssetId: null,
        provider: "external",
        generationMode: "imported",
        sourceKind: "imported",
        importedFrom: request.importedFrom || request.sourceFilePath,
        checksum: imported.checksum,
        usage: request.usage ?? [],
        notes: sanitizeNotes(request.notes),
      };
      const added = await manifest.add(record);
      if (config.createThumbnails) await createAndAttachThumbnail(rootDir, config, manifest, thumbnailer, added);
      await auditLogger.log({ action: "asset_import", assetId: id, user: actor, details: `Imported ${request.title}.` });
      return manifest.findById(id) as Promise<AssetRecord>;
    },

    async approveAsset(id, actor = "local-user") {
      assertAssetId(id);
      const config = await loadConfig(rootDir);
      const asset = await requireAsset(manifest, id);
      const filePath = asset.filePath && asset.status !== "approved" ? await storage.moveAssetFile(config, asset.filePath, "approved") : asset.filePath;
      const updated = await manifest.update(id, { status: "approved", filePath, approvedAt: new Date().toISOString(), approvedBy: actor });
      await auditLogger.log({ action: "approval", assetId: id, user: actor, details: `Approved ${asset.title}.` });
      return updated;
    },

    async rejectAsset(id, reason, actor = "local-user") {
      assertAssetId(id);
      const config = await loadConfig(rootDir);
      const asset = await requireAsset(manifest, id);
      const filePath = asset.filePath && asset.status !== "rejected" ? await storage.moveAssetFile(config, asset.filePath, "rejected") : asset.filePath;
      const updated = await manifest.update(id, { status: "rejected", filePath, rejectedAt: new Date().toISOString(), rejectedReason: sanitizeNotes(reason, 1000) });
      await auditLogger.log({ action: "rejection", assetId: id, user: actor, details: reason });
      return updated;
    },

    async requestRevision(id, notes, actor = "local-user") {
      assertAssetId(id);
      const asset = await requireAsset(manifest, id);
      const updated = await manifest.update(id, { status: "needs_revision", notes: [asset.notes, sanitizeNotes(notes)].filter(Boolean).join("\n\n") });
      await auditLogger.log({ action: "revision_requested", assetId: id, user: actor, details: notes });
      return updated;
    },

    async archiveAsset(id, actor = "local-user") {
      assertAssetId(id);
      const config = await loadConfig(rootDir);
      const asset = await requireAsset(manifest, id);
      const filePath = asset.filePath && asset.status !== "archived" ? await storage.moveAssetFile(config, asset.filePath, "archived") : asset.filePath;
      const updated = await manifest.update(id, { status: "archived", filePath });
      await auditLogger.log({ action: "archive", assetId: id, user: actor, details: `Archived ${asset.title}.` });
      return updated;
    },

    async getAssetById(id) {
      assertAssetId(id);
      return manifest.findById(id);
    },

    async getApprovedAssets(filters = {}) {
      const all = (await manifest.read()).assets;
      return filterAssets(all, { ...filters, approvedOnly: true });
    },

    async searchAssets(filters = {}) {
      const all = (await manifest.read()).assets;
      const approvedOnly = process.env.ASSET_FORGE_APPROVED_ONLY === "true" ? true : filters.approvedOnly;
      return filterAssets(all, { ...filters, approvedOnly });
    },
  };
}

async function requireAsset(manifest: AssetManifestAdapter, id: string): Promise<AssetRecord> {
  const asset = await manifest.findById(id);
  if (!asset) throw new Error(`Asset Forge could not find asset ${id}.`);
  return asset;
}

async function createAndAttachThumbnail(
  rootDir: string,
  config: AssetForgeConfig,
  manifest: AssetManifestAdapter,
  thumbnailer: ThumbnailProvider,
  asset: AssetRecord,
): Promise<void> {
  if (!asset.filePath) return;
  const sourcePath = projectPath(rootDir, asset.filePath);
  const extension = asset.format || "png";
  const targetRelative = `${config.defaultAssetRoot}/thumbnails/${slugify(asset.id)}.${extension}`.replaceAll("//", "/");
  const targetPath = projectPath(rootDir, targetRelative);
  await thumbnailer.createThumbnail({ sourcePath, targetPath, width: 320, height: 320 });
  await manifest.update(asset.id, { thumbnailPath: targetRelative });
}
