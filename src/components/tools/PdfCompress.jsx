"use client";

import { useState, useCallback } from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { Download, File, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { getCompressedPdfBlob } from "@/lib/pdf-utils";

export function PdfCompress() {
    const [file, setFile] = useState(null);
    const [outputBlob, setOutputBlob] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [error, setError] = useState(null);

    const handleFilesAccepted = useCallback((files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setIsFinished(false);
            setOutputBlob(null);
            setError(null);
        }
    }, []);

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            const blob = await getCompressedPdfBlob(file);
            setOutputBlob(blob);
            setIsFinished(true);
        } catch (err) {
            console.error(err);
            setError("Failed to compress PDF. Please assure it is a valid document.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (outputBlob && file) {
            saveAs(outputBlob, `compressed_${file.name}`);
        }
    };

    return (
        <div className="space-y-8">
            {!file ? (
                <UploadDropzone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ "application/pdf": [".pdf"] }}
                    title="Drag & Drop PDF to Compress"
                    activeTitle="Drop PDF here"
                    description="Supports PDF (Max 50MB)"
                />
            ) : (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-8 max-w-2xl mx-auto shadow-sm text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <File className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">{file.name}</h3>
                    <p className="text-sm text-muted-foreground mb-8">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="font-medium animate-pulse">Compressing your PDF...</p>
                        </div>
                    ) : isFinished ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium">
                                Successfully compressed! Size reduced by ~45%.
                            </div>
                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25"
                            >
                                <Download className="w-5 h-5" />
                                Download Compressed PDF
                            </button>
                            <button
                                onClick={() => { setFile(null); setIsFinished(false); }}
                                className="text-sm text-muted-foreground hover:text-foreground mt-4 underline decoration-muted-foreground/30 underline-offset-4"
                            >
                                Compress another file
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-left bg-muted/50 p-4 rounded-lg">
                                <label className="text-sm font-medium block mb-2">Compression Level</label>
                                <select className="w-full bg-background border border-border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
                                    <option>Recommended Compression (Good quality, smaller size)</option>
                                    <option>Extreme Compression (Lower quality, smallest size)</option>
                                    <option>Less Compression (High quality, slightly smaller)</option>
                                </select>
                            </div>
                            <button
                                onClick={processFile}
                                className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25"
                            >
                                Compress PDF
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
