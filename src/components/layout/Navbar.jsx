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
                    <span className="font-bold text-xl tracking-tight">PrateekToolkit</span>
                </Link>
                <div className="flex items-center gap-4">
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        GitHub
                    </a>
                </div>
            </div>
        </nav>
    );
}
