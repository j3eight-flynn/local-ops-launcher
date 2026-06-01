import { randomUUID } from "node:crypto";
import type { AssetManifest, AssetRecord, AssetStatus } from "./types.js";
import { loadConfig } from "./config.js";
import { projectPath, readJsonFile, writeJsonFile } from "./files.js";
import { appendAuditLog } from "./log.js";

export async function readManifest(rootDir = process.cwd()): Promise<AssetManifest> {
  const config = await loadConfig(rootDir);
  return readJsonFile<AssetManifest>(projectPath(rootDir, config.manifestPath), { assets: [] });
}

export async function writeManifest(rootDir: string, manifest: AssetManifest): Promise<void> {
  const config = await loadConfig(rootDir);
  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (ids.has(asset.id)) {
      throw new Error(`Asset Forge found a duplicate asset ID and stopped before saving: ${asset.id}`);
    }
    ids.add(asset.id);
  }
  await writeJsonFile(projectPath(rootDir, config.manifestPath), manifest);
  await appendAuditLog(rootDir, { action: "manifest_edit", details: `Saved ${manifest.assets.length} asset records.` });
}

export function createAssetId(): string {
  return `asset_${randomUUID()}`;
}

export async function addAsset(rootDir: string, record: AssetRecord): Promise<AssetRecord> {
  const manifest = await readManifest(rootDir);
  if (manifest.assets.some((asset) => asset.id === record.id)) {
    throw new Error(`Asset Forge could not add the asset because the ID already exists: ${record.id}`);
  }
  manifest.assets.push(record);
  await writeManifest(rootDir, manifest);
  await appendAuditLog(rootDir, { action: "asset_added", assetId: record.id, details: `Added ${record.title}.` });
  return record;
}

export async function updateAsset(rootDir: string, assetId: string, updates: Partial<AssetRecord>): Promise<AssetRecord> {
  const manifest = await readManifest(rootDir);
  const index = manifest.assets.findIndex((asset) => asset.id === assetId);
  if (index < 0) throw new Error(`Asset Forge could not find asset ${assetId}.`);
  const updated = { ...manifest.assets[index], ...updates, updatedAt: new Date().toISOString() };
  manifest.assets[index] = updated;
  await writeManifest(rootDir, manifest);
  await appendAuditLog(rootDir, { action: "asset_updated", assetId, details: `Updated ${updated.title}.` });
  return updated;
}

export async function findAssetById(rootDir: string, assetId: string): Promise<AssetRecord | undefined> {
  const manifest = await readManifest(rootDir);
  return manifest.assets.find((asset) => asset.id === assetId);
}

export async function updateAssetStatus(rootDir: string, assetId: string, status: AssetStatus): Promise<AssetRecord> {
  return updateAsset(rootDir, assetId, { status });
}

export async function getApprovedAssets(rootDir = process.cwd()): Promise<AssetRecord[]> {
  const manifest = await readManifest(rootDir);
  return manifest.assets.filter((asset) => asset.status === "approved");
}

export async function getApprovedAssetsByType(assetType: string, rootDir = process.cwd()): Promise<AssetRecord[]> {
  const assets = await getApprovedAssets(rootDir);
  return assets.filter((asset) => asset.assetType === assetType);
}

export async function getAssetById(assetId: string, rootDir = process.cwd()): Promise<AssetRecord | undefined> {
  return findAssetById(rootDir, assetId);
}

export async function getAssetsByTag(tag: string, rootDir = process.cwd()): Promise<AssetRecord[]> {
  const manifest = await readManifest(rootDir);
  return manifest.assets.filter((asset) => asset.tags.includes(tag));
}

export async function getAssetsForUsage(usage: string, rootDir = process.cwd()): Promise<AssetRecord[]> {
  const manifest = await readManifest(rootDir);
  return manifest.assets.filter((asset) => asset.usage.includes(usage));
}
