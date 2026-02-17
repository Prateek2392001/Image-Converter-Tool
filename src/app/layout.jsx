
import { Inter, Outfit } from "next/font/google"; // Using Outfit for modern SaaS look as requested (ish)
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const fontSans = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
});

const fontOutfit = Outfit({
    variable: "--font-heading",
    subsets: ["latin"],
});

export const metadata = {
    title: "PixelToolkit – Image Converter & Compressor",
    description: "Convert, Compress & Resize Images Instantly — No Upload Needed. 100% Frontend Only.",
};

export default function RootLayout({
    children,
}) {
    return (
        <html lang="en" className="dark">
            <body
                className={cn(
                    "min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/30 selection:text-primary-foreground",
                    fontSans.variable,
                    fontOutfit.variable
                )}
            >
                <div className="relative flex min-h-screen flex-col">
                    <Navbar />
                    <main className="flex-1 container mx-auto px-4 py-8">
                        {children}
                    </main>
                    <footer className="py-6 border-t border-white/5 text-center text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} PixelToolkit. All local, no server.</p>
                    </footer>
                </div>
            </body>
        </html>
    );
}
