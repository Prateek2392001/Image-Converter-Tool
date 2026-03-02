"use client";

import { PdfCompress } from "@/components/tools/PdfCompress";

export default function PdfCompressPage() {
    return (
        <div className="min-h-screen py-10 bg-background text-foreground">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-10 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 mb-4 tracking-tight">
                        Compress PDF
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Reduce file size while optimizing for maximal PDF quality.
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <PdfCompress />
                </div>
            </div>
        </div>
    );
}
