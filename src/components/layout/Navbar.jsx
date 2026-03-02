"use client";

import Link from "next/link";
import { Zap, ChevronDown, FileText, FileImage, FileBarChart, HardDrive, Edit3 } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  return (
    <nav className="border-b border-white/10 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            PrateekToolkit
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <div
            className="relative"
            onMouseEnter={() => setIsPdfOpen(true)}
            onMouseLeave={() => setIsPdfOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-4">
              PDF Tools <ChevronDown className="w-4 h-4" />
            </button>
            {isPdfOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col z-50 animate-in fade-in slide-in-from-top-2">
                <Link href="/pdf-compress" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Compress PDF</span>
                </Link>
                <Link href="/pdf-to-word" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">PDF to Word</span>
                </Link>
                <Link href="/pdf-to-ppt" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                  <FileBarChart className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">PDF to PPT</span>
                </Link>
                <Link href="/pdf-to-excel" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                  <FileBarChart className="w-4 h-4 text-green-500" />
                  <span className="text-sm">PDF to Excel</span>
                </Link>
                <Link href="/edit-pdf" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                  <Edit3 className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Edit PDF</span>
                </Link>
                <Link href="/pdf-to-jpg" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                  <FileImage className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">PDF to JPG</span>
                </Link>
                <Link href="/jpg-to-pdf" className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                  <FileText className="w-4 h-4 text-red-400" />
                  <span className="text-sm">JPG to PDF</span>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/color-picker"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            Color Picker
          </Link>
          <Link
            href="/background-remover"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            Background Remover
          </Link>
          <Link
            href="/image-resizer"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            Image Resizer
          </Link>
        </div>
      </div>
    </nav>
  );
}
