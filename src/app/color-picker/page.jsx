"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Droplet, Copy, Check, AlertCircle, Palette, MousePointer2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ColorPickerPage() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [pickedColor, setPickedColor] = useState(null);
    const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState(null);

    // New State for Tabs & Palette
    const [activeTab, setActiveTab] = useState("picker"); // "picker" | "palette"
    const [paletteColors, setPaletteColors] = useState([]);
    const [isExtracting, setIsExtracting] = useState(false);

    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        setIsEyeDropperSupported("EyeDropper" in window);
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Cleanup previous URL
        if (previewUrl) URL.revokeObjectURL(previewUrl);

        const isPdf = selectedFile.type === "application/pdf";
        const isImage = selectedFile.type.startsWith("image/");

        if (!isPdf && !isImage) {
            setError("Please upload an image or PDF file.");
            return;
        }

        setError(null);
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setPickedColor(null);
        setPaletteColors([]); // Reset palette

        // Auto-extract if on palette tab? Maybe wait for user action or tab switch.
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(text); // Store the copied text to show checkmark for specific item
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const pickColor = async () => {
        if (isEyeDropperSupported) {
            try {
                const eyeDropper = new window.EyeDropper();
                const result = await eyeDropper.open();
                setPickedColor(result.sRGBHex);
            } catch (e) {
                console.log("EyeDropper cancelled or failed", e);
            }
        } else {
            if (file?.type === "application/pdf") {
                setError("Your browser doesn't support picking colors directly from PDFs. Please upload an image instead.");
            }
        }
    };

    const handleImageClick = (e) => {
        // if (isEyeDropperSupported) return; // Allow canvas click as quick pick
        if (file?.type === "application/pdf") return;
        if (activeTab === "palette") return; // Don't pick in palette mode logic if we want consistency, but ok to keep enabled.

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !imageRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = "#" + [pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('');
        setPickedColor(hex);
    };

    const onImageLoad = () => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (canvas && img) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            // If extracting was requested or tab is active, we could run it here.
            if (activeTab === "palette") {
                extractPalette();
            }
        }
    };

    const extractPalette = () => {
        if (!imageRef.current || file?.type === "application/pdf") return;

        setIsExtracting(true);
        // Use a timeout to allow UI to update (show loading)
        setTimeout(() => {
            try {
                const img = imageRef.current;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Scale down for performance
                const maxDim = 100;
                let w = img.naturalWidth;
                let h = img.naturalHeight;
                if (w > maxDim || h > maxDim) {
                    const scale = maxDim / Math.max(w, h);
                    w *= scale;
                    h *= scale;
                }

                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);

                const imageData = ctx.getImageData(0, 0, w, h).data;
                const colorCounts = {};

                // Quantize and count
                for (let i = 0; i < imageData.length; i += 4) {
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    const a = imageData[i + 3];

                    if (a < 128) continue; // Skip transparent

                    // Simple quantization: round to nearest 16
                    // This groups similar colors
                    const rQ = Math.round(r / 24) * 24;
                    const gQ = Math.round(g / 24) * 24;
                    const bQ = Math.round(b / 24) * 24;

                    const hex = "#" + [rQ, gQ, bQ].map(x => {
                        const val = Math.min(255, Math.max(0, x));
                        return val.toString(16).padStart(2, '0');
                    }).join('');

                    colorCounts[hex] = (colorCounts[hex] || 0) + 1;
                }

                // Sort by frequency
                const sortedColors = Object.entries(colorCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 24) // Top 24 colors
                    .map(([hex]) => hex);

                setPaletteColors(sortedColors);
            } catch (err) {
                console.error("Palette extraction failed", err);
            } finally {
                setIsExtracting(false);
            }
        }, 100);
    };

    useEffect(() => {
        if (activeTab === "palette" && file && file.type.startsWith("image/") && paletteColors.length === 0) {
            extractPalette();
        }
    }, [activeTab, file]);

    return (
        <div className="min-h-screen py-10">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 mb-4 font-heading">
                        Color Tools
                    </h1>
                    <p className="text-muted-foreground">
                        Extract colors from images or pick precisely with the eyedropper.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Mode Switcher */}
                    <div className="flex p-1 bg-muted rounded-xl w-full max-w-md mx-auto relative mb-4">
                        <button
                            onClick={() => setActiveTab("picker")}
                            className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === "picker" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <MousePointer2 className="w-4 h-4" />
                            Picker
                        </button>
                        <button
                            onClick={() => setActiveTab("palette")}
                            className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === "palette" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Palette className="w-4 h-4" />
                            Auto Palette
                        </button>
                        <motion.div
                            layoutId="activeTabColor"
                            className="absolute inset-y-1 left-1 bg-primary rounded-lg shadow-sm"
                            initial={false}
                            animate={{
                                x: activeTab === "picker" ? 0 : "100%",
                                width: "48%"
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </div>

                    {/* Upload Section (Always visible if no file) */}
                    {!file && (
                        <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
                            <div
                                className="border-2 border-dashed border-white/20 rounded-2xl p-10 hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden"
                                onClick={() => document.getElementById('file-upload').click()}
                            >
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                                        <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-lg">Click to Upload</p>
                                        <p className="text-sm text-muted-foreground">JPG, PNG, WEBP or PDF</p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 justify-center">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Content Area */}
                    {file && (
                        <>
                            <div className="flex bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex-col md:flex-row">
                                {/* Preview / Interaction Area */}
                                <div className="flex-1 p-6 bg-muted/30 flex flex-col items-center justify-center min-h-[400px] relative border-b md:border-b-0 md:border-r border-border">
                                    <div className="absolute top-4 left-4 z-10">
                                        <button
                                            onClick={() => { setFile(null); setPaletteColors([]); setPickedColor(null); }}
                                            className="text-xs bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded backdrop-blur-md transition-colors"
                                        >
                                            Change File
                                        </button>
                                    </div>

                                    {activeTab === "picker" && isEyeDropperSupported && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <button
                                                onClick={pickColor}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-lg"
                                            >
                                                <Droplet className="w-4 h-4" />
                                                Pick Color
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative shadow-lg rounded-lg overflow-hidden max-w-full" ref={containerRef}>
                                        {file.type === "application/pdf" ? (
                                            <iframe
                                                src={previewUrl}
                                                className="w-full h-[500px] md:w-[500px] rounded-lg bg-white"
                                                title="PDF Preview"
                                            />
                                        ) : (
                                            <div className="relative group cursor-crosshair">
                                                <img
                                                    ref={imageRef}
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="max-h-[60vh] object-contain"
                                                    onLoad={onImageLoad}
                                                />
                                                <canvas
                                                    ref={canvasRef}
                                                    className="absolute inset-0 w-full h-full opacity-0"
                                                    onClick={handleImageClick}
                                                />
                                                {activeTab === "picker" && !isEyeDropperSupported && (
                                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Click image to pick color
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sidebar / Control Panel */}
                                <div className="w-full md:w-[320px] bg-card p-6 flex flex-col border-l border-white/5">
                                    {activeTab === "picker" ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                            <div
                                                className="w-24 h-24 rounded-full border-4 border-white/10 shadow-2xl transition-colors duration-300"
                                                style={{ backgroundColor: pickedColor || 'transparent' }}
                                            />

                                            <div className="space-y-2 w-full">
                                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Selected Color</p>
                                                <div className="flex items-center gap-2 bg-muted rounded-xl p-3 w-full border border-white/5">
                                                    <span className="font-mono text-xl font-bold flex-1 text-left pl-2">
                                                        {pickedColor || "---"}
                                                    </span>
                                                    {pickedColor && (
                                                        <button
                                                            onClick={() => copyToClipboard(pickedColor)}
                                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                                                        >
                                                            {isCopied === pickedColor ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-primary" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-xs text-muted-foreground max-w-[200px]">
                                                {isEyeDropperSupported
                                                    ? "Use the 'Pick Color' button or click accurately on the image."
                                                    : "Click anywhere on the image to select a color."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col">
                                            <div className="mb-4">
                                                <h3 className="font-bold text-lg">Image Palette</h3>
                                                <p className="text-xs text-muted-foreground">Dominant colors auto-extracted.</p>
                                            </div>

                                            {file?.type === "application/pdf" ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                                                    <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                                    <p>Auto-palette is not supported for PDF files. Please convert to image first.</p>
                                                </div>
                                            ) : isExtracting ? (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                                    {paletteColors.map((color, idx) => (
                                                        <motion.button
                                                            key={`${color}-${idx}`}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: idx * 0.02 }}
                                                            onClick={() => copyToClipboard(color)}
                                                            className="flex flex-col items-start p-2 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-all group relative"
                                                        >
                                                            <div
                                                                className="w-full h-12 rounded-md mb-2 border border-white/5 shadow-sm"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <div className="flex items-center justify-between w-full">
                                                                <span className="text-xs font-mono font-medium">{color}</span>
                                                                {isCopied === color && <Check className="w-3 h-3 text-green-500" />}
                                                            </div>
                                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity" />
                                                        </motion.button>
                                                    ))}
                                                    {paletteColors.length === 0 && (
                                                        <div className="col-span-2 text-center py-10 text-muted-foreground text-sm">
                                                            No colors found.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
