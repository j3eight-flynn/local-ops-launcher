import path from "node:path";
import { copyFile, mkdir } from "node:fs/promises";
import { loadConfig } from "./config.js";
import { findAssetById, updateAsset } from "./manifest.js";
import { projectPath } from "./files.js";

export async function createThumbnailPlaceholder(rootDir: string, assetId: string): Promise<string> {
  const config = await loadConfig(rootDir);
  const asset = await findAssetById(rootDir, assetId);
  if (!asset) throw new Error(`Asset Forge could not create a thumbnail because asset ${assetId} was not found.`);
  if (!asset.filePath) throw new Error("Asset Forge cannot create a thumbnail for a prompt-only asset without an image file.");

  const source = projectPath(rootDir, asset.filePath);
  const thumbnailRelative = `${config.defaultAssetRoot}/thumbnails/${asset.id}.${asset.format}`.replaceAll("//", "/");
  const target = projectPath(rootDir, thumbnailRelative);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  await updateAsset(rootDir, assetId, { thumbnailPath: thumbnailRelative });
  return thumbnailRelative;
}
