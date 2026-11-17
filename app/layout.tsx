import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers/AppProviders";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { brandAssetPath } from "@/lib/brand-assets";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const butterpop = localFont({
  src: "./fonts/Butterpop.ttf",
  variable: "--font-butterpop",
  display: "swap",
  weight: "400",
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
    <html lang="en" className={`${inter.variable} ${montserrat.variable} ${butterpop.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
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
      </body>
    </html>
  );
}
