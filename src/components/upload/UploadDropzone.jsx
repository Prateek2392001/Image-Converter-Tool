"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UploadDropzone({
    onFilesAccepted,
    className,
    accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".avif"] },
    title = "Drag & Drop Images",
    activeTitle = "Drop images here",
    description = "Supports PNG, JPG, WEBP, AVIF"
}) {
    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        onDrop: (accepted, rejected) => {
            if (accepted.length > 0) {
                onFilesAccepted(accepted);
            }
        },
        accept
    });

    return (
        <div className={className}>
            <motion.div
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card/50"}
        `}
                {...getRootProps()}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                        <UploadCloud className={`w-10 h-10 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
                    </div>

                    <h3 className="text-2xl font-bold font-heading">
                        {isDragActive ? activeTitle : title}
                    </h3>

                    <p className="text-muted-foreground max-w-sm mx-auto">
                        or <span className="text-primary font-medium hover:underline">browse files</span> from your device
                    </p>

                    <p className="text-xs text-muted-foreground mt-4 uppercase tracking-wider font-medium">
                        {description}
                    </p>
                </div>

                {/* Success animation on file drop? Or just list below? */}
                <AnimatePresence>
                    {isDragActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center rounded-3xl pointer-events-none"
                        >
                            <div className="bg-background p-4 rounded-full shadow-xl">
                                <UploadCloud className="w-8 h-8 text-primary animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
