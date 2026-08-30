import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReelDash — Your Instagram Reels Library",
  description: "Save, organize, and search your Instagram Reels. DM any reel to @ReelDash_app and it's instantly in your library.",
  metadataBase: new URL("https://reeldash-nine.vercel.app"),
  openGraph: {
    title: "ReelDash",
    description: "Your Instagram Reels, organized automatically.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${bricolage.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
