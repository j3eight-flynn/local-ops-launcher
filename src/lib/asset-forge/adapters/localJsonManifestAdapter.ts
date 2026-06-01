import { copyFile, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AssetManifest, AssetManifestAdapter, AssetRecord } from "../types.js";
import { loadConfig } from "../config.js";
import { projectPath, readJsonFile } from "../files.js";
import { assertAssetId } from "../validation.js";

const manifestLocks = new Map<string, Promise<unknown>>();

export class LocalJsonManifestAdapter implements AssetManifestAdapter {
  constructor(private readonly rootDir: string) {}

  async read(): Promise<AssetManifest> {
    const filePath = await this.manifestPath();
    return validateManifest(await readJsonFile<AssetManifest>(filePath, { assets: [] }));
  }

  async write(manifest: AssetManifest): Promise<void> {
    const filePath = await this.manifestPath();
    await withManifestLock(filePath, async () => {
      await this.writeUnlocked(validateManifest(manifest), filePath);
    });
  }

  async add(record: AssetRecord): Promise<AssetRecord> {
    assertAssetId(record.id);
    const filePath = await this.manifestPath();
    return withManifestLock(filePath, async () => {
      const manifest = validateManifest(await readJsonFile<AssetManifest>(filePath, { assets: [] }));
      if (manifest.assets.some((asset) => asset.id === record.id)) {
        throw new Error(`Asset Forge could not add the asset because the ID already exists: ${record.id}`);
      }
      manifest.assets.push(record);
      await this.writeUnlocked(manifest, filePath);
      return record;
    });
  }

  async update(assetId: string, updates: Partial<AssetRecord>): Promise<AssetRecord> {
    assertAssetId(assetId);
    const filePath = await this.manifestPath();
    return withManifestLock(filePath, async () => {
      const manifest = validateManifest(await readJsonFile<AssetManifest>(filePath, { assets: [] }));
      const index = manifest.assets.findIndex((asset) => asset.id === assetId);
      if (index < 0) throw new Error(`Asset Forge could not find asset ${assetId}.`);
      const updated = { ...manifest.assets[index], ...updates, updatedAt: new Date().toISOString() };
      manifest.assets[index] = updated;
      await this.writeUnlocked(manifest, filePath);
      return updated;
    });
  }

  async findById(assetId: string): Promise<AssetRecord | undefined> {
    assertAssetId(assetId);
    const manifest = await this.read();
    return manifest.assets.find((asset) => asset.id === assetId);
  }

  private async manifestPath(): Promise<string> {
    const config = await loadConfig(this.rootDir);
    return projectPath(this.rootDir, config.manifestPath);
  }

  private async writeUnlocked(manifest: AssetManifest, filePath: string): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    try {
      const backupDir = path.join(path.dirname(filePath), ".asset-forge-backups");
      await mkdir(backupDir, { recursive: true });
      await copyFile(filePath, path.join(backupDir, `asset-manifest.${new Date().toISOString().replace(/[:.]/g, "-")}.json`));
    } catch {
      // First write has no prior manifest to back up.
    }
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await rename(tempPath, filePath);
  }
}

function validateManifest(manifest: AssetManifest): AssetManifest {
  const ids = new Set<string>();
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  for (const asset of assets) {
    assertAssetId(asset.id);
    if (ids.has(asset.id)) throw new Error(`Asset Forge found a duplicate asset ID: ${asset.id}`);
    ids.add(asset.id);
  }
  return { assets };
}

async function withManifestLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = manifestLocks.get(key) ?? Promise.resolve();
  const current = previous.then(work, work);
  const stored = current.catch(() => undefined);
  manifestLocks.set(key, stored);
  try {
    return await current;
  } finally {
    if (manifestLocks.get(key) === stored) manifestLocks.delete(key);
  }
}
