import { adminManifest } from "@/lib/pwa-manifest";

export function GET() {
  return Response.json(adminManifest(), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
