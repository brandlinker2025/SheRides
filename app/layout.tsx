import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
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

export const metadata: Metadata = {
  title: "SheRides — Ride. Connect. Belong.",
  description: "Bangladesh Women Riders Community",
  applicationName: "SheRides",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SheRides",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#E91E63",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
          rel="stylesheet"
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
