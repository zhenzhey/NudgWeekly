import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "NUDG — Goal Tracking Platform",
  description: "Complete long-term goals with AI-powered planning and tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0A0A0F] text-white antialiased`}>
        {/* Top navigation */}
        <nav className="sticky top-0 z-40 border-b border-[#1E1E2E] bg-[#0A0A0F]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-400 flex items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="font-bold text-white tracking-tight">NUDG</span>
            </a>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Goal Tracker</span>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
