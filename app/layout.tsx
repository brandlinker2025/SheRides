import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ICON_NAMES } from "@/lib/icon-names";
import { AppProviders } from "@/components/providers/AppProviders";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { brandAssetPath } from "@/lib/brand-assets";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = "https://sherides.online";
const ogImage = `${brandAssetPath}/share.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SheRides - Women-only ride sharing in Bangladesh",
  description: "Safe rides by women, for women. Book now, pre-book, or hire by the hour.",
  keywords: ["female biker bangladesh", "women motorcycle", "sherides"],
  applicationName: "SheRides",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: `${brandAssetPath}/favicon.ico` },
      { url: `${brandAssetPath}/icon-16.png`, sizes: "16x16", type: "image/png" },
      { url: `${brandAssetPath}/icon-32.png`, sizes: "32x32", type: "image/png" },
      { url: `${brandAssetPath}/icon-48.png`, sizes: "48x48", type: "image/png" },
      { url: `${brandAssetPath}/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: `${brandAssetPath}/icon-180.png`, sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SheRides - Women-only ride sharing in Bangladesh",
    description: "Safe rides by women, for women. Book now, pre-book, or hire by the hour.",
    url: siteUrl,
    siteName: "SheRides",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "SheRides — women-only ride sharing in Bangladesh" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SheRides - Women-only ride sharing in Bangladesh",
    description: "Safe rides by women, for women. Book now, pre-book, or hire by the hour.",
    images: [ogImage],
  },
  appleWebApp: {
    capable: true,
    title: "SheRides",
    statusBarStyle: "black-translucent",
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#460377",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link
          href={`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${ICON_NAMES.join(",")}&display=block`}
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('sherides-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__sheridesBIP=e;});",
          }}
        />
      </head>
      <body className="bg-surface text-on-surface font-body-md antialiased">
        <AppProviders>
          {children}
        </AppProviders>
        <RegisterSW />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"Organization\",\"@id\":\"https://sherides.online/#organization\",\"name\":\"SheRides\",\"url\":\"https://sherides.online/\",\"description\":\"Women-only ride sharing in Bangladesh.\",\"parentOrganization\":{\"@type\":\"Organization\",\"@id\":\"https://www.brandlinkerbd.com/#organization\",\"name\":\"BrandLinker\",\"url\":\"https://www.brandlinkerbd.com/\",\"founder\":{\"@type\":\"Person\",\"name\":\"RS Lina\",\"url\":\"https://rslina.com/\"}}}" }} />
      </body>
    </html>
  );
}
