"use client";

import { PdfToWord } from "@/components/tools/PdfToWord";

export default function PdfToWordPage() {
    return (
        <div className="min-h-screen py-10 bg-background text-foreground">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-10 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-4 tracking-tight">
                        PDF to Word
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Convert your PDF files to editable Word documents instantly.
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <PdfToWord />
                </div>
            </div>
        </div>
    );
}
