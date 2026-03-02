"use client";

import { useState } from "react";
import { Upload, Download, Settings, Lock, Unlock, SlidersHorizontal } from "lucide-react";

export function ImageResizer() {
    const [imageSrc, setImageSrc] = useState(null);
    const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

    // Resize States
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [lockAspectRatio, setLockAspectRatio] = useState(true);

    // Compression States
    const [quality, setQuality] = useState(80); // 0-100
    const [format, setFormat] = useState("image/jpeg"); // image/jpeg, image/png, image/webp

    const [isExporting, setIsExporting] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImageSrc(event.target.result);
                    setOriginalDimensions({ width: img.width, height: img.height });
                    setWidth(img.width.toString());
                    setHeight(img.height.toString());
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleWidthChange = (val) => {
        setWidth(val);
        const w = parseInt(val);
        if (lockAspectRatio && originalDimensions.width && !isNaN(w)) {
            const aspect = originalDimensions.width / originalDimensions.height;
            setHeight(Math.round(w / aspect).toString());
        }
    };

    const handleHeightChange = (val) => {
        setHeight(val);
        const h = parseInt(val);
        if (lockAspectRatio && originalDimensions.height && !isNaN(h)) {
            const aspect = originalDimensions.width / originalDimensions.height;
            setWidth(Math.round(h * aspect).toString());
        }
    };

    const handleDownload = () => {
        if (!imageSrc) return;
        setIsExporting(true);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const finalWidth = parseInt(width) || originalDimensions.width;
            const finalHeight = parseInt(height) || originalDimensions.height;

            canvas.width = finalWidth;
            canvas.height = finalHeight;
            const ctx = canvas.getContext("2d");

            // Draw original image resized
            ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

            let ext = format.split("/")[1];
            if (ext === "jpeg") ext = "jpg";

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = `resized_image.${ext}`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                setIsExporting(false);
            }, format, quality / 100);
        };
        img.src = imageSrc;
    };

    if (!imageSrc) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors h-[400px]">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Upload Image to Resize & Compress</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Easily change image resolution and optimize file size.
                </p>
                <label className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors">
                    Select Image
                    <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                </label>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Main Area: Image Preview */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="relative w-full bg-neutral-900 rounded-xl overflow-hidden shadow-xl min-h-[400px] border border-border flex items-center justify-center p-4">
                    <img
                        src={imageSrc}
                        alt="Preview"
                        style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain" }}
                    />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                    <span>Original: {originalDimensions.width} &times; {originalDimensions.height} px</span>
                    <button
                        onClick={() => {
                            setImageSrc(null);
                            setWidth("");
                            setHeight("");
                        }}
                        className="hover:text-destructive underline underline-offset-2"
                    >
                        Choose different image
                    </button>
                </div>
            </div>

            {/* Sidebar: Settings */}
            <div className="lg:col-span-1 space-y-6 flex flex-col">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-6">
                    <div>
                        <h3 className="font-bold flex items-center gap-2 mb-4 border-b border-border pb-2">
                            <Settings className="w-4 h-4 text-primary" />
                            Resolution
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                                <span>Output Size</span>
                                <button
                                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                                    className={`flex items-center gap-1.5 p-1 px-2 rounded hover:bg-muted transition-colors ${lockAspectRatio ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                                >
                                    {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    {lockAspectRatio ? "Locked" : "Unlocked"}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Width (px)</label>
                                    <input
                                        type="number"
                                        value={width}
                                        onChange={(e) => handleWidthChange(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Height (px)</label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => handleHeightChange(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold flex items-center gap-2 mb-4 border-b border-border pb-2">
                            <SlidersHorizontal className="w-4 h-4 text-primary" />
                            Compression
                        </h3>

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Format</label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                >
                                    <option value="image/jpeg">JPEG (Smaller file size)</option>
                                    <option value="image/webp">WEBP (Modern format)</option>
                                    <option value="image/png">PNG (Lossless, larger size)</option>
                                </select>
                            </div>

                            {format !== "image/png" && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-foreground">Quality</label>
                                        <span className="text-xs font-medium text-primary">{quality}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={quality}
                                        onChange={(e) => setQuality(parseInt(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Smallest Size</span>
                                        <span>Highest Quality</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isExporting || !width || !height}
                    className="w-full py-3 bg-gradient-to-r from-primary to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExporting ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                    Download Image
                </button>
            </div>
        </div>
    );
}
