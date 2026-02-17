"use client";

import { motion } from "framer-motion";
import { Settings, Image as ImageIcon, Ruler, Wand2 } from "lucide-react";

export function ToolPanel({
    activeMode,
    onModeChange,
    settings,
    onSettingsChange,
    onProcess,
    isProcessing,
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mt-8 space-y-6">
            {/* Tabs */}
            <div className="flex p-1 bg-muted rounded-lg w-full max-w-md mx-auto relative">
                <button
                    onClick={() => onModeChange("convert")}
                    className={`
            relative z-10 flex-1 py-2 text-sm font-medium rounded-md transition-colors 
            ${activeMode === "convert" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
          `}
                >
                    Convert
                </button>
                <button
                    onClick={() => onModeChange("compress")}
                    className={`
            relative z-10 flex-1 py-2 text-sm font-medium rounded-md transition-colors
            ${activeMode === "compress" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
          `}
                >
                    Compress
                </button>
                <button
                    onClick={() => onModeChange("favicon")}
                    className={`
            relative z-10 flex-1 py-2 text-sm font-medium rounded-md transition-colors
            ${activeMode === "favicon" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
          `}
                >
                    Favicon
                </button>

                {/* Animated Background for Active Tab */}
                <motion.div
                    layoutId="activeTab"
                    className="absolute inset-y-1 left-1 bg-primary rounded-md shadow-sm"
                    initial={false}
                    animate={{
                        x: activeMode === "convert" ? 0 : activeMode === "compress" ? "100%" : "200%",
                        width: "32.5%" // Approx 1/3 minus padding
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {activeMode === "favicon" ? (
                    <div className="col-span-2 text-center space-y-4 py-4">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium">Standard Favicon Generation</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            This will generate a complete package of favicons for your website, including:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                            {[16, 32, 48, 180, 192, 512].map(size => (
                                <span key={size} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                    {size}x{size}
                                </span>
                            ))}
                            <span className="px-2 py-1 bg-muted rounded text-xs font-mono">favicon.ico</span>
                            <span className="px-2 py-1 bg-muted rounded text-xs font-mono">site.webmanifest</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Left Column: Format & Quality */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                    Output Format
                                </label>
                                <select
                                    value={settings.format} // In compress mode, force "original" or hidden?
                                    onChange={(e) => onSettingsChange({ format: e.target.value })}
                                    disabled={activeMode === "compress"} // In compress mode, we keep original usually, but user might want to compress AND validly convert.
                                    // User prompt implies separate tabs. Compress usually implies "Make smaller", Convert "Change type". 
                                    // Often compression tools also convert heavily to WebP. 
                                    // Let's create a "Keep Original" option for Compressing.
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:opacity-50"
                                >
                                    {activeMode === "convert" ? (
                                        <>
                                            <option value="image/png">PNG</option>
                                            <option value="image/jpeg">JPEG</option>
                                            <option value="image/webp">WEBP</option>
                                            <option value="image/avif">AVIF</option>
                                        </>
                                    ) : (
                                        <option value="original">Keep Original Format</option>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Wand2 className="w-4 h-4 text-primary" />
                                        Quality
                                    </span>
                                    <span className="text-muted-foreground font-mono">{Math.round(settings.quality * 100)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.05"
                                    value={settings.quality}
                                    onChange={(e) => onSettingsChange({ quality: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Lower quality = smaller file size.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Resizing */}
                        <div className="space-y-6 border-l border-border/50 pl-0 md:pl-8">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Ruler className="w-4 h-4 text-primary" />
                                    Resize Image
                                </label>
                                <input
                                    type="checkbox"
                                    checked={settings.resize}
                                    onChange={(e) => onSettingsChange({ resize: e.target.checked })}
                                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background"
                                />
                            </div>

                            <div className={`space-y-4 transition-opacity ${settings.resize ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground uppercase font-bold">Scale</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            step="10"
                                            value={settings.scale}
                                            onChange={(e) => onSettingsChange({ scale: parseInt(e.target.value) })}
                                            disabled={!settings.resize}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <span className="text-sm font-mono w-12 text-right">{settings.scale}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Action Button */}
            <div className="pt-6 border-t border-border mt-6 flex justify-end">
                <button
                    onClick={onProcess}
                    disabled={isProcessing}
                    className={`
            relative overflow-hidden group px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all
            ${isProcessing ? "bg-muted cursor-wait opacity-80" : "bg-gradient-to-r from-primary to-indigo-600 hover:scale-105 active:scale-95"}
          `}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {isProcessing ? (
                            <>Processing...</>
                        ) : (
                            <>
                                {activeMode === "convert" ? "Convert Images" : activeMode === "compress" ? "Compress Images" : "Generate Favicons"}
                            </>
                        )}
                    </span>
                </button>
            </div>
        </div>
    );
}
