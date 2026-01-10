import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import ParticleBackground from "@/components/ui/ParticleBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "COLREG Assistant",
  description: "Maritime navigation chatbot specializing in COLREGs",
  keywords: ["COLREG", "Gemini", "GenAI", "LangGraph", "FastAPI", "Python", "Maritime AI", "Patrik Božurić"],
  authors: [{ name: "Patrik Božurić" }],
  creator: "Patrik Božurić",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col overflow-hidden`}
      >
        <ParticleBackground />
        <Navigation />
        <main className="flex-1 flex flex-col min-h-0 overflow-auto scrollbar-hide">{children}</main>
      </body>
    </html>
  );
}
