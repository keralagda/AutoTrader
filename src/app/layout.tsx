import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { CookieConsent } from "@/components/CookieConsent";
import { VoiceNavigator } from "@/components/VoiceNavigator";

const geistSans = {
  variable: "font-sans",
};

const geistMono = {
  variable: "font-mono",
};

export const metadata: Metadata = {
  title: "BNFX - USDC Auto-Earning Platform",
  description: "Automated crypto investment platform with daily returns up to 15%. Join BNFX and enable your USDC auto-earning mode with AI-powered trading.",
  keywords: ["BNFX", "USDC", "crypto", "investment", "auto-earning", "trading", "DeFi"],
  authors: [{ name: "BNFX" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BNFX",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/bnfx-logo-dark.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <VoiceNavigator />
        <ServiceWorkerRegistration />
        <CookieConsent />
      </body>
    </html>
  )
}
