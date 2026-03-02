"use client";

import { useState, useCallback } from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { Download, FileText, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { convertPdfToDocxBlob } from "@/lib/pdf-utils";

export function PdfToWord() {
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
            const blob = await convertPdfToDocxBlob(file);
            setOutputBlob(blob);
            setIsFinished(true);
        } catch (err) {
            console.error(err);
            setError("Failed to convert PDF. Error: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (outputBlob && file) {
            saveAs(outputBlob, `${file.name.replace('.pdf', '')}.docx`);
        }
    };

    return (
        <div className="space-y-8">
            {!file ? (
                <UploadDropzone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ "application/pdf": [".pdf"] }}
                    title="Drag & Drop PDF to Convert to Word"
                    activeTitle="Drop PDF here"
                    description="Supports PDF to DOCX conversion"
                />
            ) : (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-8 max-w-2xl mx-auto shadow-sm text-center">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">{file.name}</h3>
                    <p className="text-sm text-muted-foreground mb-8">
                        Ready to convert
                    </p>

                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="font-medium animate-pulse text-blue-500">Converting to Word format...</p>
                        </div>
                    ) : isFinished ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium">
                                Conversion complete! Your Word document is ready.
                            </div>
                            <button
                                onClick={handleDownload}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25"
                            >
                                <Download className="w-5 h-5" />
                                Download Word File
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
                            <button
                                onClick={processFile}
                                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25"
                            >
                                Convert to Word
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
