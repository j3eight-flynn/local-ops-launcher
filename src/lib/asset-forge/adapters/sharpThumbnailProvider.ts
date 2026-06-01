import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { ThumbnailProvider } from "../types.js";

export class SharpThumbnailProvider implements ThumbnailProvider {
  async createThumbnail(input: {
    sourcePath: string;
    targetPath: string;
    width: number;
    height: number;
  }): Promise<void> {
    await mkdir(path.dirname(input.targetPath), { recursive: true });
    try {
      const loadSharp = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<{ default: unknown }>;
      const sharp = (await loadSharp("sharp")).default as (sourcePath: string) => {
        resize(width: number, height: number, options: { fit: string; withoutEnlargement: boolean }): {
          toFile(targetPath: string): Promise<void>;
        };
      };
      await sharp(input.sourcePath)
        .resize(input.width, input.height, { fit: "inside", withoutEnlargement: true })
        .toFile(input.targetPath);
    } catch {
      await copyFile(input.sourcePath, input.targetPath);
    }
  }
}
