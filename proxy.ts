import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_OPEN_ACCESS } from "./lib/admin/open-access";
import { isApprovedProfile } from "./lib/profile";

const PUBLIC_PATHS = new Set(["/", "/login", "/admin-login", "/signup", "/download", "/api/keep-alive"]);
const AUTH_ONLY_PATHS = new Set(["/verification", "/pending-approval", "/verify-phone"]);
const PUBLIC_METADATA_PATHS = new Set([
  "/manifest.webmanifest",
  "/admin.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/icon.svg",
]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (PUBLIC_METADATA_PATHS.has(pathname)) return true;
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|map)$/i.test(pathname)) return true;
  return false;
}

function isAdminAppPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ADMIN_OPEN_ACCESS) {
    if (pathname === "/admin-login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (isAdminAppPath(pathname) || pathname.startsWith("/api/admin/")) {
      return NextResponse.next();
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return redirectToLogin(request, pathname);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request, pathname);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("verified, role")
    .eq("id", user.id)
    .maybeSingle();

  if (pathname === "/pending-approval" || pathname === "/verify-phone") {
    if (isApprovedProfile(profile)) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    if (pathname === "/verify-phone") {
      return NextResponse.redirect(new URL("/pending-approval", request.url));
    }
    return response;
  }

  if (AUTH_ONLY_PATHS.has(pathname)) {
    return response;
  }

  if (!isApprovedProfile(profile)) {
    return NextResponse.redirect(new URL("/pending-approval", request.url));
  }

  if (isAdminAppPath(pathname)) {
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return response;
  }

  return response;
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const login = request.nextUrl.clone();
  login.pathname = isAdminAppPath(pathname) ? "/admin-login" : "/login";
  login.search = "";
  if (pathname !== "/login" && pathname !== "/admin-login") {
    login.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
