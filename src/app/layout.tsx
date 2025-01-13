import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { Suspense } from "react";
import { Providers } from "~/components/ui/providers";
import { TailwindIndicator } from "~/components/ui/tailwind-indicator";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "Kedai POS",
  description: "POS System for Malaysian Restaurants",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const runtime = "edge";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Suspense>
          <Providers>
            <div className="relative flex min-h-screen flex-col justify-between bg-background transition-all">
              {children}
            </div>
            <TailwindIndicator />
            <Toaster />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
