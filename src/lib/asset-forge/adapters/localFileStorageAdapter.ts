import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { AssetForgeConfig, AssetStatus, AssetStorageAdapter, AssetTypeDefinition, SavedAssetFile } from "../types.js";
import { assertInside, moveAssetFile, projectPath, saveBufferWithoutOverwrite } from "../files.js";

export class LocalFileStorageAdapter implements AssetStorageAdapter {
  constructor(private readonly rootDir: string) {}

  async ensureBaseFolders(config: AssetForgeConfig): Promise<void> {
    const assetRoot = projectPath(this.rootDir, config.defaultAssetRoot);
    await mkdir(projectPath(this.rootDir, "/asset-forge"), { recursive: true });
    await Promise.all(["draft", "approved", "rejected", "archived", "thumbnails", "source", "references"].map((folder) => mkdir(path.join(assetRoot, folder), { recursive: true })));
  }

  async ensureAssetTypeFolders(config: AssetForgeConfig, typeDefinition: AssetTypeDefinition): Promise<void> {
    const assetRoot = projectPath(this.rootDir, config.defaultAssetRoot);
    await Promise.all(["draft", "approved", "rejected", "archived"].map((state) => mkdir(path.join(assetRoot, state, typeDefinition.defaultFolder), { recursive: true })));
    await mkdir(path.join(assetRoot, "source", typeDefinition.defaultFolder), { recursive: true });
  }

  async saveDraftAsset(params: {
    config: AssetForgeConfig;
    typeDefinition: AssetTypeDefinition;
    fileName: string;
    buffer: Buffer;
  }): Promise<SavedAssetFile> {
    const relativePath = `${params.config.defaultAssetRoot}/draft/${params.typeDefinition.defaultFolder}/${params.fileName}`.replaceAll("//", "/");
    return this.saveBuffer(params.config, relativePath, params.buffer);
  }

  async saveSourceText(params: {
    config: AssetForgeConfig;
    typeDefinition: AssetTypeDefinition;
    fileName: string;
    text: string;
  }): Promise<SavedAssetFile> {
    const relativePath = `${params.config.defaultAssetRoot}/source/${params.typeDefinition.defaultFolder}/${params.fileName}`.replaceAll("//", "/");
    return this.saveBuffer(params.config, relativePath, Buffer.from(params.text, "utf8"));
  }

  async importAssetFile(params: {
    config: AssetForgeConfig;
    typeDefinition: AssetTypeDefinition;
    sourceFilePath: string;
    fileName: string;
    status: Extract<AssetStatus, "draft" | "approved">;
  }): Promise<SavedAssetFile> {
    const buffer = await readFile(params.sourceFilePath);
    const relativePath = `${params.config.defaultAssetRoot}/${params.status}/${params.typeDefinition.defaultFolder}/${params.fileName}`.replaceAll("//", "/");
    return this.saveBuffer(params.config, relativePath, buffer);
  }

  async moveAssetFile(config: AssetForgeConfig, fromRelativePath: string, status: Extract<AssetStatus, "approved" | "rejected" | "archived">): Promise<string> {
    return moveAssetFile(this.rootDir, config, fromRelativePath, status);
  }

  async createThumbnail(params: {
    config: AssetForgeConfig;
    sourceRelativePath: string;
    assetId: string;
    format: string;
  }): Promise<SavedAssetFile> {
    const source = projectPath(this.rootDir, params.sourceRelativePath);
    const relativePath = `${params.config.defaultAssetRoot}/thumbnails/${params.assetId}.${params.format}`.replaceAll("//", "/");
    const absolutePath = projectPath(this.rootDir, relativePath);
    assertInside(projectPath(this.rootDir, params.config.defaultAssetRoot), absolutePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await copyFile(source, absolutePath);
    return { relativePath, absolutePath, checksum: await checksumFile(absolutePath) };
  }

  private async saveBuffer(config: AssetForgeConfig, relativePath: string, buffer: Buffer): Promise<SavedAssetFile> {
    const absolutePath = projectPath(this.rootDir, relativePath);
    assertInside(projectPath(this.rootDir, config.defaultAssetRoot), absolutePath);
    await saveBufferWithoutOverwrite(absolutePath, buffer);
    return { relativePath, absolutePath, checksum: checksumBuffer(buffer) };
  }
}

export function checksumBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function checksumFile(filePath: string): Promise<string> {
  await stat(filePath);
  return checksumBuffer(await readFile(filePath));
}
