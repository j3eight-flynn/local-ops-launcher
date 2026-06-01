import type { AssetRecord, AssetStatus, AssetType } from "./types.js";
import { readManifest } from "./manifest.js";

export interface AssetSearchFilters {
  status?: AssetStatus;
  assetType?: AssetType;
  tag?: string;
  usage?: string;
  packId?: string;
  search?: string;
  approvedOnly?: boolean;
}

export async function searchAssets(rootDir: string, filters: AssetSearchFilters): Promise<AssetRecord[]> {
  const manifest = await readManifest(rootDir);
  return filterAssets(manifest.assets, filters);
}

export function filterAssets(assets: AssetRecord[], filters: AssetSearchFilters): AssetRecord[] {
  const search = filters.search?.toLowerCase().trim();
  return assets.filter((asset) => {
    if (filters.approvedOnly && asset.status !== "approved") return false;
    if (filters.status && asset.status !== filters.status) return false;
    if (filters.assetType && asset.assetType !== filters.assetType) return false;
    if (filters.tag && !asset.tags.includes(filters.tag)) return false;
    if (filters.usage && !asset.usage.includes(filters.usage)) return false;
    if (filters.packId && asset.packId !== filters.packId) return false;
    if (search) {
      const haystack = [asset.title, asset.description, asset.notes, asset.tags.join(" "), asset.usage.join(" ")]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}
