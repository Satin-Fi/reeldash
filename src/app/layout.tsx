import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ReelProvider } from "@/context/ReelContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReelDash — Personal Visual Memory System for Instagram Reels",
  description: "Organize, search, and revisit saved Instagram Reels automatically with AI intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <AuthProvider>
          <ReelProvider>{children}</ReelProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
