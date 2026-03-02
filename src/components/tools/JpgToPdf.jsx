"use client";

import { useState, useCallback } from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { Download, File, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { convertJpgsToPdfBlob } from "@/lib/pdf-utils";

export function JpgToPdf() {
    const [files, setFiles] = useState([]);
    const [outputBlob, setOutputBlob] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [error, setError] = useState(null);

    const handleFilesAccepted = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFiles(prev => [...prev, ...acceptedFiles]);
            setIsFinished(false);
            setOutputBlob(null);
            setError(null);
        }
    }, []);

    const processFile = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setError(null);
        try {
            const blob = await convertJpgsToPdfBlob(files);
            setOutputBlob(blob);
            setIsFinished(true);
        } catch (err) {
            console.error(err);
            setError("Failed to generate PDF. Make sure all images are valid.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (outputBlob) {
            saveAs(outputBlob, `combined_images.pdf`);
        }
    };

    return (
        <div className="space-y-8">
            {files.length === 0 ? (
                <UploadDropzone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
                    title="Drag & Drop JPGs to Convert to PDF"
                    activeTitle="Drop Images here"
                    description="Supports JPG, PNG, WEBP merging"
                />
            ) : (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-8 max-w-2xl mx-auto shadow-sm text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <File className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">{files.length} images selected</h3>
                    <p className="text-sm text-muted-foreground mb-8">
                        Ready to combine into a single PDF
                    </p>

                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                            <p className="font-medium animate-pulse text-red-500">Creating PDF document...</p>
                        </div>
                    ) : isFinished ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium">
                                Conversion complete! Your combined PDF is ready.
                            </div>
                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/25"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF File
                            </button>
                            <button
                                onClick={() => { setFiles([]); setIsFinished(false); }}
                                className="text-sm text-muted-foreground hover:text-foreground mt-4 underline decoration-muted-foreground/30 underline-offset-4"
                            >
                                Create another PDF
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-left bg-muted/50 p-4 rounded-lg">
                                <label className="text-sm font-medium block mb-2">Page Orientation</label>
                                <select className="w-full bg-background border border-border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500">
                                    <option>Portrait</option>
                                    <option>Landscape</option>
                                    <option>Auto</option>
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <UploadDropzone
                                    onFilesAccepted={handleFilesAccepted}
                                    accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
                                    className="flex-1"
                                    title="Add More"
                                    activeTitle="Drop Info"
                                    description="+"
                                />
                                <div className="flex-[3]">
                                    <button
                                        onClick={processFile}
                                        className="w-full h-full bg-gradient-to-r from-red-500 to-rose-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white rounded-xl font-bold shadow-lg shadow-red-500/25"
                                    >
                                        Convert to PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
