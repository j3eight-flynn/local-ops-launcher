import type { AssetForgeAuthorizer, AssetForgeAuthorizationContext } from "./types.js";

let hostAuthorizer: AssetForgeAuthorizer | undefined;

export function setAssetForgeAuthorizer(authorizer: AssetForgeAuthorizer | undefined): void {
  hostAuthorizer = authorizer;
}

export async function authorizeAssetForgeAdmin(context: AssetForgeAuthorizationContext): Promise<boolean> {
  if (hostAuthorizer) {
    return Boolean(await hostAuthorizer(context));
  }

  const token = process.env.ASSET_FORGE_ADMIN_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  const requestToken = context.request?.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    || context.request?.headers.get("x-asset-forge-token")
    || "";
  return requestToken === token;
}

export async function requireAssetForgeAdmin(context: AssetForgeAuthorizationContext): Promise<void> {
  if (!(await authorizeAssetForgeAdmin(context))) {
    throw new Error("Asset Forge admin access is required for this action.");
  }
}
