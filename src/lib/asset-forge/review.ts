import { loadConfig } from "./config.js";
import { findAssetById, updateAsset } from "./manifest.js";
import { moveAssetFile, projectPath } from "./files.js";
import { appendAuditLog } from "./log.js";

export async function approveAsset(rootDir: string, assetId: string, approvedBy = "local-user") {
  const config = await loadConfig(rootDir);
  const asset = await requireAsset(rootDir, assetId);
  const filePath = asset.filePath ? await moveAssetFile(rootDir, config, asset.filePath, "approved") : asset.filePath;
  const updated = await updateAsset(rootDir, assetId, {
    status: "approved",
    filePath,
    approvedAt: new Date().toISOString(),
    approvedBy,
  });
  await appendAuditLog(rootDir, { action: "approval", assetId, user: approvedBy, details: `Approved ${asset.title}.` });
  return updated;
}

export async function rejectAsset(rootDir: string, assetId: string, reason: string, user = "local-user") {
  const config = await loadConfig(rootDir);
  const asset = await requireAsset(rootDir, assetId);
  const filePath = asset.filePath ? await moveAssetFile(rootDir, config, asset.filePath, "rejected") : asset.filePath;
  const updated = await updateAsset(rootDir, assetId, {
    status: "rejected",
    filePath,
    rejectedAt: new Date().toISOString(),
    rejectedReason: reason,
  });
  await appendAuditLog(rootDir, { action: "rejection", assetId, user, details: reason });
  return updated;
}

export async function requestRevision(rootDir: string, assetId: string, notes: string, user = "local-user") {
  const asset = await requireAsset(rootDir, assetId);
  const updated = await updateAsset(rootDir, assetId, {
    status: "needs_revision",
    notes: [asset.notes, notes].filter(Boolean).join("\n\n"),
  });
  await appendAuditLog(rootDir, { action: "revision_requested", assetId, user, details: notes });
  return updated;
}

export async function archiveAsset(rootDir: string, assetId: string, user = "local-user") {
  const config = await loadConfig(rootDir);
  const asset = await requireAsset(rootDir, assetId);
  const filePath = asset.filePath ? await moveAssetFile(rootDir, config, asset.filePath, "archived") : asset.filePath;
  const updated = await updateAsset(rootDir, assetId, { status: "archived", filePath });
  await appendAuditLog(rootDir, { action: "archive", assetId, user, details: `Archived ${asset.title}.` });
  return updated;
}

export async function importLocalAsset(rootDir: string, params: {
  sourceFilePath: string;
  assetId: string;
  targetRelativePath: string;
}) {
  const config = await loadConfig(rootDir);
  const target = projectPath(rootDir, params.targetRelativePath);
  const assetRoot = projectPath(rootDir, config.defaultAssetRoot);
  if (!target.startsWith(assetRoot)) {
    throw new Error("Asset Forge import target must stay inside the configured asset folder.");
  }
  return updateAsset(rootDir, params.assetId, { filePath: params.targetRelativePath });
}

async function requireAsset(rootDir: string, assetId: string) {
  const asset = await findAssetById(rootDir, assetId);
  if (!asset) throw new Error(`Asset Forge could not find asset ${assetId}.`);
  return asset;
}
