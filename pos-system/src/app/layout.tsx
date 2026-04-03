import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ConnectivityProvider } from "@/components/shared/ConnectivityProvider";
import { PWARegistration } from "../components/shared/PWARegistration";

const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://cortex-pos.vercel.app"),
  title: {
    template: "%s | Cortex POS",
    default: "Cortex POS - AI-Powered Point of Sale System",
  },
  description: "Advanced Point of Sale System powered by Next.js and AI insights. Manage your inventory, sales, and customers efficiently.",
  keywords: ["POS", "Point of Sale", "Inventory Management", "AI POS", "Next.js POS", "Sales Tracking", "Retail Software"],
  authors: [{ name: "Cortex Team" }],
  creator: "Cortex Team",
  publisher: "Cortex Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cortex POS",
  },
  openGraph: {
    title: "Cortex POS - AI-Powered Point of Sale System",
    description: "Advanced Point of Sale System powered by Next.js and AI insights.",
    url: "https://cortex-pos.vercel.app",
    siteName: "Cortex POS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cortex POS - AI-Powered Point of Sale System",
    description: "Advanced Point of Sale System powered by Next.js and AI insights.",
    creator: "@cortexpos",
  },
};

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConnectivityProvider>
            <PWARegistration />
            {children}
            <Toaster position="top-right" />
          </ConnectivityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
