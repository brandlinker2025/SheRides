/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://irjybaasydqcfuldczeu.supabase.co",
  // nominatim.openstreetmap.org = free address search for ride booking pickup/drop-off.
  "connect-src 'self' https://irjybaasydqcfuldczeu.supabase.co wss://irjybaasydqcfuldczeu.supabase.co https://nominatim.openstreetmap.org",
  "media-src 'self' blob: https://irjybaasydqcfuldczeu.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "irjybaasydqcfuldczeu.supabase.co" },
    ],
  },
  async redirects() {
    // Social pages and the SOS center were removed. Old links land on ride booking or admin review.
    return [
      // Short share links for installing the app on any phone.
      ...["/install", "/app", "/get", "/apk"].map((source) => ({ source, destination: "/download", permanent: false })),
      { source: "/partner", destination: "/?flow=partner", permanent: false },
      { source: "/signup", has: [{ type: "query", key: "captain", value: "1" }], destination: "/?flow=partner&step=signup", permanent: false },
      { source: "/signup", destination: "/?flow=ride&step=signup", permanent: false },
      { source: "/login", has: [{ type: "query", key: "next", value: "/go/apply\\?role=rider" }], destination: "/?flow=partner", permanent: false },
      { source: "/login", destination: "/?flow=ride", permanent: false },
      { source: "/go/apply", has: [{ type: "query", key: "role", value: "rider" }], destination: "/?flow=partner&step=apply", permanent: false },
      { source: "/go/apply", destination: "/?flow=ride&step=apply", permanent: false },
      { source: "/go/ride/:id", destination: "/?flow=ride&trip=:id", permanent: false },
      { source: "/go", has: [{ type: "query", key: "tab", value: "rider" }], destination: "/?flow=partner", permanent: false },
      { source: "/go", destination: "/?flow=ride", permanent: false },

      { source: "/safety", destination: "/go", permanent: false },
      { source: "/rider-benefits", destination: "/go", permanent: false },
      { source: "/admin/emergency-alerts", destination: "/admin/go", permanent: false },
      ...["home", "explore", "messages", "groups", "events", "rides", "saved"].map((segment) => ({
        source: `/${segment}/:path*`,
        destination: "/go",
        permanent: false,
      })),
      ...["posts", "events"].map((segment) => ({ source: `/admin/${segment}`, destination: "/admin", permanent: false })),
    ];
  },
  async rewrites() {
    return [
      { source: "/apple-touch-icon", destination: "/apple-touch-icon.png" },
      { source: "/apple-touch-icon-precomposed", destination: "/apple-touch-icon-precomposed.png" },
      { source: "/apple-icon", destination: "/apple-touch-icon.png" },
      { source: "/apple-icon.png", destination: "/apple-touch-icon.png" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/sherides.apk",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: "attachment; filename=\"SheRides.apk\"" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/:path(go|notifications|places|profile|admin|verification|verify-phone|pending-approval)/:sub*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
