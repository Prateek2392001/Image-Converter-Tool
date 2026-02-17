"use client";

import { BackgroundRemover } from "@/components/tools/BackgroundRemover";

export default function BackgroundRemoverPage() {
    return (
        <div className="min-h-screen py-10 bg-background text-foreground">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-10 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 mb-4 tracking-tight">
                        Background Remover
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Remove backgrounds from images instantly with AI. Replace with colors, gradients, or custom images.
                    </p>
                </div>

                <BackgroundRemover />
            </div>
        </div>
    );
}
