"use client";

import { ImageResizer } from "@/components/tools/ImageResizer";

export default function ImageResizerPage() {
    return (
        <div className="min-h-screen py-10 bg-background text-foreground">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-10 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400 mb-4 tracking-tight">
                        Image Resizer & Crop
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Easily crop and resize your images for Social Media, Mobile, and Web with one click.
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <ImageResizer />
                </div>
            </div>
        </div>
    );
}
