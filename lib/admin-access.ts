/**
 * Authorization helpers.
 *
 * profiles.role is a server-protected column (update triggers reject member
 * edits). user_metadata, display names, and browser storage are never
 * authorization sources.
 *
 * platform_owner is the immutable owner claim. It lives in app_metadata,
 * which only the Auth admin API can write. getUser() reads that record from
 * the Auth server; a cached JWT can be stale, so do not read this from
 * getSession(). Missing or non-boolean values are denied.
 *
 * The live SheRides project does not have this claim on any account yet.
 * Callers must not treat "claim missing" as permission.
 */
export function isAdminProfileRole(role: unknown): boolean {
  return role === "admin";
}

export function hasPlatformOwnerClaim(appMetadata: unknown): boolean {
  if (!appMetadata || typeof appMetadata !== "object" || Array.isArray(appMetadata)) return false;
  return (appMetadata as Record<string, unknown>).platform_owner === true;
}
