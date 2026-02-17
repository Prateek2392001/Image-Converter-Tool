"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ImageGallery } from "@/components/gallery/ImageGallery";
import { ToolPanel } from "@/components/tools/ToolPanel";
import { Hero } from "@/components/home/Hero";
import { processImage, generateFaviconPack } from "@/lib/image-processing";
// import { v4 as uuidv4 } from "uuid";

export default function Home() {
    const [files, setFiles] = useState([]);
    const [activeMode, setActiveMode] = useState("convert");
    const [isProcessing, setIsProcessing] = useState(false);

    const [settings, setSettings] = useState({
        format: "image/png",
        quality: 0.8,
        resize: false,
        scale: 100,
        width: 0,
        height: 0,
        maintainAspectRatio: true,
    });

    const handleFilesAccepted = useCallback((newFiles) => {
        const newImageFiles = newFiles.map((file) => ({
            id: crypto.randomUUID(),
            file,
            preview: URL.createObjectURL(file), // Need to revoke later
            format: file.type,
            size: file.size,
            width: 0, // Will be set on loading
            height: 0,
            status: "pending",
        }));

        setFiles((prev) => [...prev, ...newImageFiles]);
    }, []);

    const handleRemove = useCallback((id) => {
        setFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file) URL.revokeObjectURL(file.preview);
            return prev.filter((f) => f.id !== id);
        });
    }, []);

    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);

        try {
            // Process files sequentially or parallel? Parallel is faster but heavier on memory/CPU for many files.
            // Let's do parallel with Promise.all for reasonable batch size.
            const processed = await Promise.all(
                files.map(async (file) => {
                    // Skip if already processed? Maybe re-process if settings changed?
                    // For now, always re-process on click.

                    // Update status to processing
                    setFiles((prev) =>
                        prev.map((f) => (f.id === file.id ? { ...f, status: "processing" } : f))
                    );

                    try {
                        let blob;
                        if (activeMode === "favicon") {
                            blob = await generateFaviconPack(file.file);
                        } else {
                            blob = await processImage(file.file, {
                                format: activeMode === "compress" ? "original" : settings.format,
                                quality: settings.quality,
                                scale: settings.scale / 100, // Convert 100% -> 1.0
                                resize: settings.resize,
                            });
                        }

                        return {
                            id: file.id,
                            status: "done",
                            processedBlob: blob,
                            processedSize: blob.size,
                            processedUrl: URL.createObjectURL(blob),
                        };
                    } catch (error) {
                        console.error("Processing failed for", file.file.name, error);
                        return {
                            id: file.id,
                            status: "error",
                        };
                    }
                })
            );

            setFiles((prev) =>
                prev.map((f) => {
                    const result = processed.find((p) => p.id === f.id);
                    return result ? { ...f, ...result } : f;
                })
            );
        } catch (error) {
            console.error("Batch processing error", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = (id) => {
        const file = files.find((f) => f.id === id);
        if (file && file.processedBlob) {
            // Determine extension
            // Determine extension
            let ext = "png";
            if (activeMode === "favicon") {
                ext = "zip";
            } else if (settings.format !== "original") {
                ext = settings.format.split("/")[1];
            } else {
                // Use original extension but maybe verify via MIME
                ext = file.file.name.split(".").pop() || "png";
            }

            let filename = `processed_${file.file.name.split('.')[0]}.${ext}`;
            if (activeMode === "favicon") {
                filename = `favicon_pack_${file.file.name.split('.')[0]}.zip`;
            }

            saveAs(file.processedBlob, filename);
        }
    };

    const handleDownloadAll = async () => {
        const zip = new JSZip();
        const processedFiles = files.filter(f => f.status === "done" && f.processedBlob);

        if (processedFiles.length === 0) return;

        processedFiles.forEach((file) => {
            let ext = "png";
            if (activeMode === "favicon") {
                ext = "zip";
            } else if (settings.format !== "original" && activeMode === "convert") {
                ext = settings.format.split("/")[1];
            } else {
                ext = file.file.name.split(".").pop() || "png";
            }

            zip.file(`processed_${file.file.name.split('.')[0]}.${ext}`, file.processedBlob);
        });

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "pixeltoolkit_images.zip");
    };

    return (
        <div className="min-h-screen pb-20">
            <Hero />

            <div id="upload-area" className="container max-w-5xl mx-auto px-4 -mt-10 relative z-20">
                <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
                    <UploadDropzone onFilesAccepted={handleFilesAccepted} />

                    <ImageGallery
                        files={files}
                        onRemove={handleRemove}
                        onDownload={handleDownload}
                    />

                    {files.length > 0 && (
                        <>
                            <ToolPanel
                                activeMode={activeMode}
                                onModeChange={setActiveMode}
                                settings={settings}
                                onSettingsChange={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
                                onProcess={handleProcess}
                                isProcessing={isProcessing}
                            />

                            {files.some(f => f.status === "done") && (
                                <div className="flex justify-center mt-6">
                                    <button
                                        onClick={handleDownloadAll}
                                        className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
                                    >
                                        Download All as ZIP
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
