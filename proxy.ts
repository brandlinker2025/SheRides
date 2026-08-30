import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/admin-login", "/signup"]);
const AUTH_ONLY_PATHS = new Set(["/pending-approval"]);
const PUBLIC_METADATA_PATHS = new Set([
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/icon.svg",
]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (PUBLIC_METADATA_PATHS.has(pathname)) return true;
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|map)$/i.test(pathname)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  if (AUTH_ONLY_PATHS.has(pathname)) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("verified, role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  const isApproved = profile?.verified === true || isAdmin;

  if (pathname.startsWith("/admin")) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL(isApproved ? "/home" : "/pending-approval", request.url));
    }
    return response;
  }

  if (!isApproved) {
    return NextResponse.redirect(new URL("/pending-approval", request.url));
  }

  return response;
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const login = request.nextUrl.clone();
  login.pathname = pathname.startsWith("/admin") ? "/admin-login" : "/login";
  login.search = "";
  if (pathname !== "/login" && pathname !== "/admin-login") {
    login.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
