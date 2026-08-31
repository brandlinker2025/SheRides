import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers/AppProviders";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { RegisterSW } from "@/components/pwa/RegisterSW";
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
const ogImage = `${siteUrl}/sherides-panda-og.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SheRides - Bangladesh Women Riders Community",
  description: "Bangladesh women riders community. Ride. Connect. Belong.",
  keywords: ["female biker bangladesh", "women motorcycle", "sherides"],
  applicationName: "SheRides",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SheRides - Bangladesh Women Riders Community",
    description: "Bangladesh women riders community. Ride. Connect. Belong.",
    url: siteUrl,
    siteName: "SheRides",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "SheRides panda — Bangladesh Women Riders Community" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SheRides - Bangladesh Women Riders Community",
    description: "Bangladesh women riders community. Ride. Connect. Belong.",
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
  themeColor: "#E91E63",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} ${butterpop.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
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
          <InstallPrompt />
        </AppProviders>
        <RegisterSW />
      </body>
    </html>
  );
}
