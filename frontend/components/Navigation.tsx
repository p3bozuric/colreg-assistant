"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PARENT_URL = process.env.NEXT_PUBLIC_PARENT_URL || "https://bozuric.com";

export default function Navigation() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-background/80 border-b border-border"
    >
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a
            href={PARENT_URL}
            className="transition-transform duration-300 hover:scale-105"
            title="Go to main site"
          >
            <Image
              src="/logo.svg"
              alt="Bozuric Logo"
              width={200}
              height={200}
              className="h-10 md:h-12 w-auto"
            />
          </a>
          <div className="flex items-center gap-1">
            <button className="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 font-medium transition-all duration-300 hover:bg-primary/20">
              Assistant
            </button>
          </div>
        </div>
        <div className="text-muted text-sm hidden md:block">
          COLREG AI Assistant
        </div>
      </nav>
    </motion.header>
  );
}
