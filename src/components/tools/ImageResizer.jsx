"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Upload, Download, RotateCw, ZoomIn, Image as ImageIcon, Smartphone, Laptop, Layout, Monitor, Instagram, Facebook, Twitter, Linkedin, Youtube, Grid, Circle, Maximize, Crop as CropIcon, Palette, Move, Layers, BoxSelect } from "lucide-react";
import getCroppedImg, { generateCanvasImage } from "@/lib/crop-utils";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS = [
    { id: "free", label: "Free Custom", aspect: null, icon: Layout },
    { id: "square", label: "Square", aspect: 1, icon: Grid },
    { id: "circle", label: "Circle Avatar", aspect: 1, shape: "round", icon: Circle },
    { id: "mobile_port", label: "Mobile Portrait", aspect: 9 / 16, icon: Smartphone },
    { id: "mobile_land", label: "Mobile Landscape", aspect: 16 / 9, icon: Smartphone },
    { id: "desktop", label: "Desktop/Video", aspect: 16 / 9, icon: Monitor },

    // Social Media
    { id: "insta_post", label: "Instagram Post", aspect: 1, icon: Instagram },
    { id: "insta_story", label: "Instagram Story", aspect: 9 / 16, icon: Instagram },
    { id: "insta_port", label: "Instagram Portrait", aspect: 4 / 5, icon: Instagram },

    { id: "fb_cover", label: "Facebook Cover", aspect: 820 / 312, icon: Facebook },
    { id: "tw_header", label: "Twitter Header", aspect: 1500 / 500, icon: Twitter },
    { id: "li_cover", label: "LinkedIn Cover", aspect: 1584 / 396, icon: Linkedin },
    { id: "yt_thumb", label: "YouTube Thumb", aspect: 1280 / 720, icon: Youtube },
];

export function ImageResizer() {
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // New States
    const [mode, setMode] = useState("crop"); // 'crop' | 'fit'
    const [fitBackground, setFitBackground] = useState({ type: "blur", value: "#ffffff" }); // { type: 'color'|'blur', value: string }
    const [fitPadding, setFitPadding] = useState(0.05); // 0 to 0.5

    const canvasRef = useRef(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
        }
    };

    const readFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    const handleDownload = async () => {
        if (!imageSrc) return;

        setIsExporting(true);
        try {
            let blob;
            if (mode === "crop") {
                if (!croppedAreaPixels) return;
                blob = await getCroppedImg(
                    imageSrc,
                    croppedAreaPixels,
                    rotation,
                    { horizontal: false, vertical: false },
                    selectedPreset.id === "circle" ? "round" : "rect"
                );
            } else {
                // Fit Mode Export
                // Calculate aspect ratio. If 'free', maybe use image aspect or default 1?
                // For 'Fit' mode, user usually selects a target container. 
                // If 'free', we should probably just export original with padding? Or force a ratio?
                // Let's assume aspect defaults to 1 if null in Fit Mode for now, or use image aspect ratio logic.
                const aspectRatio = selectedPreset.aspect || 1; // Default to square if free form selected in Fit mode

                blob = await generateCanvasImage(
                    imageSrc,
                    aspectRatio,
                    fitBackground,
                    fitPadding,
                    rotation
                );
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `processed_${mode}_${selectedPreset.id}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally {
            setIsExporting(false);
        }
    };

    if (!imageSrc) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors h-[400px]">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Upload Image to Resize & Crop</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Choose from standard presets for Social Media, Web, and Mobile.
                </p>
                <label className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors">
                    Select Image
                    <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                </label>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
            {/* Sidebar: Presets */}
            <div className="lg:col-span-1 space-y-4 max-h-[600px] flex flex-col">
                <div className="font-bold text-lg flex items-center justify-between">
                    <span>Presets</span>
                    <button
                        onClick={() => setImageSrc(null)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                    >
                        Change Image
                    </button>
                </div>

                <div className="flex mb-2 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setMode("crop")}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded transition-colors ${mode === "crop" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
                    >
                        <CropIcon className="w-3 h-3" /> Crop
                    </button>
                    <button
                        onClick={() => setMode("fit")}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded transition-colors ${mode === "fit" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
                    >
                        <Maximize className="w-3 h-3" /> Fit Canvas
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                    {PRESETS.map((preset) => {
                        const Icon = preset.icon || Layout;
                        const isSelected = selectedPreset.id === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => {
                                    setSelectedPreset(preset);
                                    if (mode === "crop") {
                                        setRotation(0);
                                        setZoom(1);
                                    }
                                }}
                                className={`
                                    w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                                    ${isSelected
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-card border-border hover:bg-muted"
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                <div>
                                    <div className="text-sm font-medium">{preset.label}</div>
                                    <div className="text-xs text-muted-foreground opacity-80">
                                        {preset.aspect ? `Ratio: ${preset.aspect < 1 ? preset.aspect.toFixed(2) : preset.aspect}` : "Free Form"}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Area */}
            <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="relative w-full flex-1 bg-neutral-900 rounded-xl overflow-hidden shadow-2xl min-h-[500px] border border-border flex items-center justify-center">

                    {mode === "crop" ? (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={selectedPreset.aspect}
                            cropShape={selectedPreset.id === "circle" ? "round" : "rect"}
                            showGrid={true}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            onCropComplete={onCropComplete}
                            classes={{
                                containerClassName: "rounded-xl",
                                mediaClassName: "",
                                cropAreaClassName: "!border-2 !border-primary/50 !shadow-[0_0_0_9999px_rgba(0,0,0,0.85)]"
                            }}
                        />
                    ) : (
                        // Fit Mode Preview
                        <div className="w-full h-full p-8 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMzMzIi8+PHBhdGggZD0iTTAgMEgxMFYxMEgwem0xMCAxMEgyMFYyMEgxMHoiIGZpbGw9IiM0NDQiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')]">
                            <div
                                className="relative shadow-2xl overflow-hidden transition-all duration-300"
                                style={{
                                    aspectRatio: selectedPreset.aspect || 1,
                                    height: selectedPreset.aspect && selectedPreset.aspect < 1 ? "90%" : "auto",
                                    width: selectedPreset.aspect && selectedPreset.aspect >= 1 ? "90%" : "auto",
                                    maxHeight: "100%",
                                    maxWidth: "100%",
                                    backgroundColor: fitBackground.type === "color" ? fitBackground.value : "transparent",
                                    backgroundImage: fitBackground.type === "blur" ? `url(${imageSrc})` : "none",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            >
                                {fitBackground.type === "blur" && (
                                    <div className="absolute inset-0 backdrop-blur-xl bg-black/20" />
                                )}

                                <div
                                    className="absolute inset-0 flex items-center justify-center z-10"
                                    style={{ padding: `${fitPadding * 100}%` }}
                                >
                                    <img
                                        src={imageSrc}
                                        alt="Start"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "contain",
                                            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Bar */}
                <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    {mode === "crop" ? (
                        <div className="flex items-center gap-6 flex-1 min-w-[200px]">
                            <div className="space-y-1 flex-1">
                                <label id="zoom-label" className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                                    <ZoomIn className="w-3 h-3" /> Zoom
                                </label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="zoom-label"
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            <div className="space-y-1 flex-1">
                                <label id="rotate-label" className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                                    <RotateCw className="w-3 h-3" /> Rotate
                                </label>
                                <input
                                    type="range"
                                    value={rotation}
                                    min={0}
                                    max={360}
                                    step={1}
                                    aria-labelledby="rotate-label"
                                    onChange={(e) => setRotation(e.target.value)}
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-6 flex-1 min-w-[200px]">
                            <div className="space-y-1">
                                <label className="text-xs font-medium flex items-center gap-2 text-muted-foreground mb-1">
                                    <Palette className="w-3 h-3" /> Background
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFitBackground({ type: "blur" })}
                                        className={`px-3 py-1 text-xs rounded border transition-colors ${fitBackground.type === "blur" ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-transparent hover:bg-muted/80"}`}
                                    >
                                        Blur
                                    </button>
                                    <div className="relative">
                                        <input
                                            type="color"
                                            className="w-8 h-6 p-0 border-0 rounded cursor-pointer"
                                            value={fitBackground.value}
                                            onChange={(e) => setFitBackground({ type: "color", value: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setFitBackground({ type: "color", value: "#ffffff" })}
                                        className={`w-6 h-6 rounded-full border border-border bg-white ${fitBackground.type === "color" && fitBackground.value === "#ffffff" ? "ring-2 ring-primary" : ""}`}
                                    />
                                    <button
                                        onClick={() => setFitBackground({ type: "color", value: "#000000" })}
                                        className={`w-6 h-6 rounded-full border border-border bg-black ${fitBackground.type === "color" && fitBackground.value === "#000000" ? "ring-2 ring-primary" : ""}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 flex-1 max-w-[200px]">
                                <label id="pad-label" className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                                    <BoxSelect className="w-3 h-3" /> Padding
                                </label>
                                <input
                                    type="range"
                                    value={fitPadding}
                                    min={0}
                                    max={0.4}
                                    step={0.01}
                                    aria-labelledby="pad-label"
                                    onChange={(e) => setFitPadding(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleDownload}
                        disabled={isExporting}
                        className="px-6 py-2.5 bg-gradient-to-r from-primary to-violet-600 text-white font-medium rounded-lg shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Download
                    </button>
                </div>
            </div>

            <style jsx global>{`
                /* Override Cropper Styles for cleaner look if needed */
                .reactEasyCrop_CropArea {
                    border-color: var(--primary) !important;
                }
            `}</style>
        </div>
    );
}
