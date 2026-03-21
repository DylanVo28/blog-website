import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "@/styles/globals.css";

const fontSans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "vietnamese"],
});

const fontSerif = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontSerif.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
