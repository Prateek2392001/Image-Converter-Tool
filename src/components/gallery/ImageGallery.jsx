"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, FileImage, Download } from "lucide-react";
import Image from "next/image";

export function ImageGallery({ files, onRemove, onDownload }) {
    if (files.length === 0) return null;

    return (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {files.map((file) => (
                    <motion.div
                        key={file.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                    >
                        {/* Header / Remove */}
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onRemove(file.id)}
                                className="p-1 bg-destructive/80 text-white rounded-full hover:bg-destructive transition-colors"
                                aria-label="Remove image"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="relative h-48 w-full bg-muted/50 flex items-center justify-center overflow-hidden">
                            {/* Use plain img for blobs usually, but Next/Image requires remote patterns or optimization. 
                   With blob: URLs, standard <img> is safer/easier unless I configure domain whitelist which is meaningless for blobs. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={file.preview}
                                alt={file.file.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />

                            {/* Status Overlay */}
                            {file.status === "processing" && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                                </div>
                            )}
                            {file.status === "done" && (
                                <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                    <CheckCircle className="w-3 h-3" /> Done
                                </div>
                            )}
                            {file.status === "error" && (
                                <div className="absolute bottom-2 left-2 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                    <AlertCircle className="w-3 h-3" /> Error
                                </div>
                            )}
                        </div>

                        {/* Footer / Info */}
                        <div className="p-4 flex items-center justify-between gap-3">
                            <div className="overflow-hidden">
                                <p className="font-medium text-sm truncate" title={file.file.name}>
                                    {file.file.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                                    <span>•</span>
                                    <span className="uppercase">{file.format.split("/")[1]}</span>
                                    {file.processedSize && file.processedSize !== file.size && (
                                        <span className="text-green-500 font-bold ml-1">
                                            → {(file.processedSize / 1024).toFixed(1)} KB
                                        </span>
                                    )}
                                </div>
                            </div>

                            {file.status === "done" && (
                                <button
                                    onClick={() => onDownload(file.id)}
                                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                                    aria-label="Download processed image"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
