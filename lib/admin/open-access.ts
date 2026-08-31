/**
 * Admin dashboard access flag.
 *
 * When true:
 * - `/admin` renders the admin dashboard without an authenticated admin session
 * - `/admin-login` immediately redirects to `/admin`
 *
 * When false:
 * - unauthenticated `/admin*` → `/admin-login`
 * - signed-in non-admin hitting `/admin*` → `/home`
 * - successful admin credentials → `/admin`
 *
 * Hardcoded false. Do not default true from env. Member routes stay unchanged.
 */
export const ADMIN_OPEN_ACCESS = false;
