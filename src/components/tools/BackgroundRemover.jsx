"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, Image as ImageIcon, Palette, Trash2, Layers, RefreshCw, X, Check } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { removeBackground } from "@imgly/background-removal";
import { motion, AnimatePresence } from "framer-motion";

export function BackgroundRemover() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null); // Blob URL
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    // Background settings
    const [bgType, setBgType] = useState("transparent"); // 'transparent', 'color', 'image'
    const [bgColor, setBgColor] = useState("#ffffff");
    const [bgImage, setBgImage] = useState(null); // URL
    const [bgGradient, setBgGradient] = useState("linear-gradient(135deg, #f6d365 0%, #fda085 100%)");

    const canvasRef = useRef(null);

    // Helper: clear all
    const handleReset = () => {
        setOriginalImage(null);
        setProcessedImage(null);
        setIsProcessing(false);
        setError(null);
        setBgType("transparent");
        setBgColor("#ffffff");
        setBgImage(null);
    };

    // Helper: process image
    const processImage = async (file) => {
        setIsProcessing(true);
        setError(null);

        // Create a URL for the original image for preview/fallback
        const originalUrl = URL.createObjectURL(file);
        setOriginalImage(originalUrl);

        try {
            // Configure for better quality/performance if needed, but defaults are usually good
            const blob = await removeBackground(file, {
                progress: (key, current, total) => {
                    // console.log(`Downloading ${key}: ${current} of ${total}`);
                },
            });
            const url = URL.createObjectURL(blob);
            setProcessedImage(url);
        } catch (err) {
            console.error("Background removal failed:", err);
            setError("Failed to remove background. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Dropzone setup
    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            processImage(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
        multiple: false,
        disabled: isProcessing,
    });

    // Handle Custom Background Image Upload
    const handleBgImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBgImage(url);
            setBgType("image");
        }
    };

    // Generate the final composite image for download
    const handleDownload = async () => {
        if (!processedImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Load images
        const loadImg = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        try {
            // 1. Load the processed foreground
            const fgImg = await loadImg(processedImage);

            // Set canvas size to match image
            canvas.width = fgImg.naturalWidth;
            canvas.height = fgImg.naturalHeight;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 2. Draw Background
            if (bgType === "color") {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (bgType === "gradient") {
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                // Parse simple gradients or just use a fixed one for MVP if parsing is hard
                // For robustness, let's just use the current bgColor if it's solid, 
                // or a simple fixed gradient if selected.
                // Actually, let's just use 'color' mode for gradients by passing the gradient as a pattern? No.
                // Let's stick to fillStyle if the user selects a solid color.

                // For gradient, we might need to parse CSS strings which is complex.
                // Simplified: use a few fixed gradient presets that we know definitions for.
                if (bgGradient === "linear-gradient(135deg, #f6d365 0%, #fda085 100%)") {
                    gradient.addColorStop(0, "#f6d365");
                    gradient.addColorStop(1, "#fda085");
                } else if (bgGradient === "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)") {
                    gradient.addColorStop(0, "#84fab0");
                    gradient.addColorStop(1, "#8fd3f4");
                } else {
                    // Fallback
                    gradient.addColorStop(0, "#ffffff");
                    gradient.addColorStop(1, "#000000");
                }
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (bgType === "image" && bgImage) {
                // Draw background image to cover (like object-fit: cover)
                const bgImg = await loadImg(bgImage);

                // Calculate aspect ratios
                const bgRatio = bgImg.width / bgImg.height;
                const canvasRatio = canvas.width / canvas.height;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (bgRatio > canvasRatio) {
                    drawHeight = canvas.height;
                    drawWidth = bgImg.width * (canvas.height / bgImg.height);
                    offsetX = (canvas.width - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    drawWidth = canvas.width;
                    drawHeight = bgImg.height * (canvas.width / bgImg.width);
                    offsetX = 0;
                    offsetY = (canvas.height - drawHeight) / 2;
                }

                ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
            }

            // 3. Draw Foreground
            ctx.drawImage(fgImg, 0, 0);

            // 4. Download
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = "processed-image.png";
            link.href = dataUrl;
            link.click();

        } catch (err) {
            console.error("Error compositing image:", err);
            alert("Failed to generate download image.");
        }
    };

    // Predefined Colors
    const solidColors = ["#ffffff", "#000000", "#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#a78bfa", "#f472b6"];
    const gradients = [
        { name: "Warm", value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
        { name: "Cool", value: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" },
        { name: "Night", value: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
    ];

    if (!processedImage && !isProcessing) {
        return (
            <div className="w-full max-w-3xl mx-auto space-y-8">
                <div
                    {...getRootProps()}
                    className={`
                    border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
                    ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                `}
                >
                    <input {...getInputProps()} />
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Upload an Image</h3>
                    <p className="text-muted-foreground mb-6">
                        Drag and drop or click to upload
                    </p>
                    <div className="flex gap-4 justify-center text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Auto Remove BG</span>
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Replace Color</span>
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Free & Private</span>
                    </div>
                </div>

                {/* Simple error display */}
                {error && (
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Editor Controls */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            Background
                        </h3>
                        <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground">
                            Start Over
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Tabs */}
                        <div className="flex p-1 bg-muted rounded-lg">
                            {["transparent", "color", "image"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setBgType(type)}
                                    className={`
                                    flex-1 py-1.5 text-xs font-medium rounded capitalize transition-all
                                    ${bgType === type ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}
                                `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Controls based on Type */}
                        <div className="min-h-[200px]">
                            {bgType === "transparent" && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground text-sm space-y-2">
                                    <div className="w-10 h-10 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                                        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCAwSDRWNEgwem00IDhIOFY0SDR6IiBmaWxsPSIjZWVlIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-50" />
                                    </div>
                                    <p>Original transparent background</p>
                                </div>
                            )}

                            {bgType === "color" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium mb-2 block">Solid Colors</label>
                                        <div className="flex flex-wrap gap-2">
                                            {solidColors.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setBgColor(c)}
                                                    className={`w-6 h-6 rounded-full border border-border transition-transform hover:scale-110 ${bgColor === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-border">
                                        <label className="text-xs font-medium mb-2 block">Gradients</label>
                                        <div className="flex flex-wrap gap-2">
                                            {gradients.map(g => (
                                                <button
                                                    key={g.name}
                                                    onClick={() => {
                                                        setBgType("gradient");
                                                        setBgGradient(g.value);
                                                    }}
                                                    className={`w-8 h-8 rounded-md border border-border transition-all hover:scale-105 ${bgType === 'gradient' && bgGradient === g.value ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                                                    style={{ background: g.value }}
                                                    title={g.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {bgType === "image" && (
                                <div className="space-y-3">
                                    <label className="text-xs font-medium block">Upload Background</label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                        {bgImage ? (
                                            <div className="relative w-full h-full">
                                                <img src={bgImage} alt="bg" className="w-full h-full object-cover rounded-lg opacity-50" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <RefreshCw className="w-5 h-5 text-white drop-shadow-md" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                                <p className="text-xs text-muted-foreground">Click to upload image</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleBgImageUpload} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleDownload}
                        className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            </div>

            {/* Right: Preview Area */}
            <div className="lg:col-span-2 bg-muted/30 border border-border/50 rounded-xl p-8 flex items-center justify-center relative overflow-hidden min-h-[500px]">
                {/* Background Layer */}
                <div
                    className="absolute inset-0 z-0 transition-all duration-300"
                    style={{
                        background: bgType === "transparent"
                            ? "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTAgMEgxMFYxMEgwem0xMCAxMEgyMFYyMEgxMHoiIGZpbGw9IiNlZWUiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')"
                            : bgType === "color"
                                ? bgColor
                                : bgType === "gradient"
                                    ? bgGradient
                                    : bgType === "image" && bgImage
                                        ? `url(${bgImage}) center/cover no-repeat`
                                        : "#ffffff"
                    }}
                />

                {/* Image Layer */}
                <AnimatePresence>
                    {isProcessing ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 flex flex-col items-center gap-4 p-6 bg-background/80 backdrop-blur rounded-xl shadow-xl"
                        >
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="font-medium text-sm">Removing background...</p>
                        </motion.div>
                    ) : (
                        processedImage && (
                            <motion.img
                                key="processed"
                                src={processedImage}
                                alt="Processed"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10 max-w-full max-h-[450px] object-contain drop-shadow-xl"
                            />
                        )
                    )}
                </AnimatePresence>

                {/* Hidden Canvas for Composition */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}
