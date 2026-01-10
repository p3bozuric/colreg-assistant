"use client";

import Image from "next/image";
import Link from "next/link"; // 1. Import Link
import { motion } from "framer-motion";
import { usePathname } from "next/navigation"; // Optional: for active styling

const PARENT_URL = process.env.NEXT_PUBLIC_PARENT_URL || "https://bozuric.com";

export default function Navigation() {
  const pathname = usePathname(); 
  const buttonClass = "px-3 py-1.5 md:px-4 md:py-2 rounded-lg border font-medium text-sm md:text-base transition-all duration-300";
  const activeStyle = "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20";
  const inactiveStyle = "text-muted-foreground border-transparent hover:text-primary hover:bg-primary/5";

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

          <div className="flex items-center gap-3">
            
            {/* Assistant Button (Home) */}
            <Link 
              href="/" 
              className={`${buttonClass} ${pathname === '/' ? activeStyle : inactiveStyle}`}
            >
              Assistant
            </Link>

            {/* New Visuals Button */}
            <Link
              href="/visuals"
              className={`${buttonClass} ${pathname === '/visuals' ? activeStyle : inactiveStyle} text-center`}
            >
              Lights &<br className="md:hidden" /> Shapes
            </Link>

            <Link
              href="/sounds"
              className={`${buttonClass} ${pathname === '/sounds' ? activeStyle : inactiveStyle} text-center`}
            >
              Sound<br className="md:hidden" /> Signals
            </Link>

          </div>
        </div>
        <div className="text-muted text-sm hidden md:block">
          COLREG AI
        </div>
      </nav>
    </motion.header>
  );
}