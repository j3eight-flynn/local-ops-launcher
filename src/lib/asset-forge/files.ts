import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AssetForgeConfig, AssetTypeDefinition } from "./types.js";

export function projectPath(rootDir: string, configuredPath: string): string {
  const relative = configuredPath.replace(/^\/+/, "");
  return path.resolve(rootDir, relative);
}

export function assertInside(baseDir: string, candidatePath: string): void {
  const base = path.resolve(baseDir);
  const candidate = path.resolve(candidatePath);
  if (candidate !== base && !candidate.startsWith(`${base}${path.sep}`)) {
    throw new Error(`Asset Forge blocked a file path outside the configured asset folder: ${candidatePath}`);
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "asset";
}

export function safeFileName(parts: {
  projectName: string;
  assetType: string;
  title: string;
  timestamp?: Date;
  version?: number;
  format: string;
}): string {
  const day = (parts.timestamp ?? new Date()).toISOString().slice(0, 10).replaceAll("-", "");
  const version = parts.version ?? 1;
  const format = parts.format.replace(/^\./, "").toLowerCase();
  return `${slugify(parts.projectName)}_${slugify(parts.assetType)}_${slugify(parts.title)}_${day}_v${version}.${format}`;
}

export async function ensureAssetFolders(rootDir: string, config: AssetForgeConfig): Promise<void> {
  const assetRoot = projectPath(rootDir, config.defaultAssetRoot);
  const folders = ["draft", "approved", "rejected", "archived", "thumbnails", "source", "references"];
  await mkdir(projectPath(rootDir, "/asset-forge"), { recursive: true });
  await Promise.all(folders.map((folder) => mkdir(path.join(assetRoot, folder), { recursive: true })));
  await mkdir(path.dirname(projectPath(rootDir, config.manifestPath)), { recursive: true });
}

export async function ensureAssetTypeFolders(
  rootDir: string,
  config: AssetForgeConfig,
  typeDefinition: AssetTypeDefinition,
): Promise<void> {
  const assetRoot = projectPath(rootDir, config.defaultAssetRoot);
  const states = ["draft", "approved", "rejected", "archived"];
  await Promise.all(states.map((state) => mkdir(path.join(assetRoot, state, typeDefinition.defaultFolder), { recursive: true })));
}

export async function saveBufferWithoutOverwrite(filePath: string, buffer: Buffer): Promise<void> {
  try {
    await stat(filePath);
    throw new Error(`Asset Forge will not overwrite an existing file: ${filePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

export async function saveTextWithoutOverwrite(filePath: string, text: string): Promise<void> {
  await saveBufferWithoutOverwrite(filePath, Buffer.from(text, "utf8"));
}

export async function moveAssetFile(rootDir: string, config: AssetForgeConfig, fromRelative: string, toStatus: string): Promise<string> {
  const assetRoot = projectPath(rootDir, config.defaultAssetRoot);
  const from = projectPath(rootDir, fromRelative);
  assertInside(assetRoot, from);

  const fromParts = fromRelative.split("/").filter(Boolean);
  const generatedIndex = fromParts.indexOf("generated");
  const stateIndex = generatedIndex >= 0 ? generatedIndex + 1 : -1;
  if (stateIndex < 0 || !fromParts[stateIndex]) {
    throw new Error("Asset Forge could not determine the asset review folder for this file.");
  }

  fromParts[stateIndex] = toStatus;
  const toRelative = `/${fromParts.join("/")}`;
  const to = projectPath(rootDir, toRelative);
  assertInside(assetRoot, to);
  await mkdir(path.dirname(to), { recursive: true });
  await rename(from, to);
  return toRelative;
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
