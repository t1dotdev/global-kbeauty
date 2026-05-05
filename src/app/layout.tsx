import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { TooltipProvider } from "~/components/ui/tooltip";
import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { ThemeProvider } from "~/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Global K-Beauty",
  description: "Multi-role certification platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      className={cn(geist.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TRPCReactProvider>
            <ThemeProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ThemeProvider>
          </TRPCReactProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
