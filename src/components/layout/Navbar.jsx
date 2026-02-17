import Link from "next/link";
import { Zap } from "lucide-react";

export function Navbar() {
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
          <Link
            href="/color-picker"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Color Picker
          </Link>
          <Link
            href="/background-remover"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Background Remover
          </Link>
          <Link
            href="/image-resizer"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Image Resizer
          </Link>
        </div>
      </div>
    </nav>
  );
}
