export type AssetStatus =
  | "draft"
  | "draft_prompt_only"
  | "needs_revision"
  | "approved"
  | "rejected"
  | "archived";

export type AssetType =
  | "character_portrait"
  | "full_body_character"
  | "background_scene"
  | "card_art"
  | "card_back"
  | "item_icon"
  | "resource_icon"
  | "building_icon"
  | "terrain_tile"
  | "faction_banner"
  | "ui_panel"
  | "sprite"
  | "sprite_sheet"
  | "marketing_visual"
  | "custom";

export interface AssetTypeDefinition {
  label: string;
  description: string;
  defaultDimensions: string;
  transparentBackground: boolean;
  safeAreaRequired: boolean;
  defaultFolder: string;
}

export type AssetTypeRegistry = Record<string, AssetTypeDefinition>;

export interface AssetForgeConfig {
  projectName: string;
  projectType: string;
  projectPurpose: string;
  audience: string;
  defaultAssetRoot: string;
  manifestPath: string;
  approvedOnlyInProduction: boolean;
  requireHumanApproval: boolean;
  createThumbnails: boolean;
  defaultImageFormat: string;
  defaultQuality: string;
  maxUploadBytes?: number;
  allowedImageFormats?: string[];
  allowedMimeTypes?: string[];
  storageAdapter?: "local-json" | "sqlite" | "postgres" | "supabase";
  styleBiblePath: string;
  promptRulesPath: string;
  negativePromptsPath: string;
  assetTypesPath: string;
  generationPresetsPath: string;
  reviewCriteriaPath: string;
}

export interface AssetRecord {
  id: string;
  project: string;
  assetType: AssetType;
  title: string;
  description: string;
  status: AssetStatus;
  tags: string[];
  styleProfile: string;
  prompt: string;
  negativePrompt: string;
  model: string;
  dimensions: string;
  format: string;
  transparentBackground: boolean;
  safeAreaRequired: boolean;
  filePath: string;
  thumbnailPath?: string;
  sourcePath?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  version: number;
  parentAssetId?: string | null;
  packId?: string;
  provider?: string;
  generationMode?: "prompt_only" | "generated" | "imported";
  sourceKind?: "generated" | "imported" | "uploaded" | "prompt_only";
  importedFrom?: string;
  auditTrailId?: string;
  checksum?: string;
  usage: string[];
  notes?: string;
}

export interface AssetManifest {
  assets: AssetRecord[];
}

export interface AssetRequest {
  title: string;
  assetType: AssetType;
  count: number;
  purpose: string;
  description: string;
  genreOverride?: string;
  styleOverride?: string;
  mood?: string;
  colorNotes?: string;
  compositionNotes?: string;
  technicalNotes?: string;
  dimensions?: string;
  transparentBackground?: boolean;
  safeAreaRequired?: boolean;
  tags?: string[];
  usage?: string[];
  notes?: string;
  packId?: string;
}

export interface AssetBrief {
  assetType: AssetType;
  title: string;
  purpose: string;
  visualDescription: string;
  styleNotes: string;
  composition: string;
  technical: {
    dimensions: string;
    format: string;
    transparentBackground: boolean;
    safeAreaRequired: boolean;
  };
}

export interface AssetPackRequest extends AssetRequest {
  packId?: string;
  packTitle: string;
  count: number;
  consistencyNotes?: string;
}

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  action: string;
  assetId?: string;
  user?: string;
  details: string;
}

export interface ImageGenerationProvider {
  generateImage(request: {
    prompt: string;
    dimensions: string;
    format: string;
    transparentBackground?: boolean;
  }): Promise<{
    imageBuffer: Buffer;
    model: string;
    revisedPrompt?: string;
  }>;
}

export interface SavedAssetFile {
  relativePath: string;
  absolutePath: string;
  checksum?: string;
}

export interface AssetStorageAdapter {
  ensureBaseFolders(config: AssetForgeConfig): Promise<void>;
  ensureAssetTypeFolders(config: AssetForgeConfig, typeDefinition: AssetTypeDefinition): Promise<void>;
  saveDraftAsset(params: {
    config: AssetForgeConfig;
    typeDefinition: AssetTypeDefinition;
    fileName: string;
    buffer: Buffer;
  }): Promise<SavedAssetFile>;
  saveSourceText(params: {
    config: AssetForgeConfig;
    typeDefinition: AssetTypeDefinition;
    fileName: string;
    text: string;
  }): Promise<SavedAssetFile>;
  importAssetFile(params: {
    config: AssetForgeConfig;
    typeDefinition: AssetTypeDefinition;
    sourceFilePath: string;
    fileName: string;
    status: Extract<AssetStatus, "draft" | "approved">;
  }): Promise<SavedAssetFile>;
  moveAssetFile(config: AssetForgeConfig, fromRelativePath: string, status: Extract<AssetStatus, "approved" | "rejected" | "archived">): Promise<string>;
  createThumbnail?(params: {
    config: AssetForgeConfig;
    sourceRelativePath: string;
    assetId: string;
    format: string;
  }): Promise<SavedAssetFile>;
}

export interface AssetManifestAdapter {
  read(): Promise<AssetManifest>;
  write(manifest: AssetManifest): Promise<void>;
  add(record: AssetRecord): Promise<AssetRecord>;
  update(assetId: string, updates: Partial<AssetRecord>): Promise<AssetRecord>;
  findById(assetId: string): Promise<AssetRecord | undefined>;
}

export interface ThumbnailProvider {
  createThumbnail(input: {
    sourcePath: string;
    targetPath: string;
    width: number;
    height: number;
  }): Promise<void>;
}

export interface AuditLogger {
  log(entry: Omit<AuditLogEntry, "timestamp">): Promise<void>;
}

export interface AssetForgeAuthorizationContext {
  request?: Request;
  action: string;
}

export type AssetForgeAuthorizer = (context: AssetForgeAuthorizationContext) => boolean | Promise<boolean>;

export interface GenerateAssetResult {
  record: AssetRecord;
  brief: AssetBrief;
  prompt: string;
  generatedImage: boolean;
  message: string;
}

export interface ImportAssetRequest {
  sourceFilePath: string;
  assetType: AssetType;
  title: string;
  description?: string;
  purpose: string;
  tags?: string[];
  usage?: string[];
  notes?: string;
  status?: Extract<AssetStatus, "draft" | "approved">;
  dimensions?: string;
  transparentBackground?: boolean;
  safeAreaRequired?: boolean;
  importedFrom?: string;
}
