"use client";

import { useState, useCallback } from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { Download, FileImage, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { pdfToImages } from "@/lib/pdf-utils";
import JSZip from "jszip";

export function PdfToJpg() {
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
            const blobs = await pdfToImages(file, 2.0); // High quality
            const zip = new JSZip();
            blobs.forEach((blob, i) => {
                zip.file(`page_${i + 1}.jpg`, blob);
            });
            const zipBlob = await zip.generateAsync({ type: "blob" });
            setOutputBlob(zipBlob);
            setIsFinished(true);
        } catch (err) {
            console.error(err);
            setError("Failed to convert PDF. Ensure it is a visual document.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (outputBlob && file) {
            saveAs(outputBlob, `${file.name.replace('.pdf', '')}_images.zip`);
        }
    };

    return (
        <div className="space-y-8">
            {!file ? (
                <UploadDropzone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ "application/pdf": [".pdf"] }}
                    title="Drag & Drop PDF to Convert to JPG"
                    activeTitle="Drop PDF here"
                    description="Supports PDF to Image conversion"
                />
            ) : (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-8 max-w-2xl mx-auto shadow-sm text-center">
                    <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileImage className="w-10 h-10 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">{file.name}</h3>
                    <p className="text-sm text-muted-foreground mb-8">
                        Ready to extract pages to images
                    </p>

                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                            <p className="font-medium animate-pulse text-purple-500">Extracting PDF pages as JPGs...</p>
                        </div>
                    ) : isFinished ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium">
                                Conversion complete! Your images have been packaged into a ZIP.
                            </div>
                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/25"
                            >
                                <Download className="w-5 h-5" />
                                Download Zip Archive
                            </button>
                            <button
                                onClick={() => { setFile(null); setIsFinished(false); }}
                                className="text-sm text-muted-foreground hover:text-foreground mt-4 underline decoration-muted-foreground/30 underline-offset-4"
                            >
                                Convert another file
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-left bg-muted/50 p-4 rounded-lg">
                                <label className="text-sm font-medium block mb-2">Image Quality</label>
                                <select className="w-full bg-background border border-border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500">
                                    <option>High Quality (100%)</option>
                                    <option>Medium Quality (75%)</option>
                                    <option>Web Quality (50%)</option>
                                </select>
                            </div>
                            <button
                                onClick={processFile}
                                className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/25"
                            >
                                Convert to JPG
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
