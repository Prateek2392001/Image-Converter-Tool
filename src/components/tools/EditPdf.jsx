"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { Download, Edit3, Loader2, Type, Image as ImageIcon, PenTool, MousePointer2, Trash2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { saveAs } from "file-saver";
import { getEditedPdfBlob, pdfToImages } from "@/lib/pdf-utils";

export function EditPdf() {
    const [file, setFile] = useState(null);
    const [pdfPages, setPdfPages] = useState([]); // array of object urls
    const [currentPage, setCurrentPage] = useState(0);
    const [modifications, setModifications] = useState({}); // { [pageIndex]: [ elements ] }

    const [isProcessing, setIsProcessing] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [outputBlob, setOutputBlob] = useState(null);
    const [error, setError] = useState(null);

    const containerRef = useRef(null);

    // Tools state
    const [selectedElementId, setSelectedElementId] = useState(null);
    const fileInputRef = useRef(null);

    const handleFilesAccepted = useCallback(async (files) => {
        if (files.length > 0) {
            const f = files[0];
            setFile(f);
            setOutputBlob(null);
            setError(null);
            setModifications({});
            setCurrentPage(0);

            // Render pages
            setIsRendering(true);
            try {
                // Render at 1.5 scale to get good quality but not massive
                const imageBlobs = await pdfToImages(f, 1.5);
                const urls = imageBlobs.map(blob => URL.createObjectURL(blob));
                setPdfPages(urls);
            } catch (err) {
                console.error("Failed to render PDF:", err);
                setError("Failed to render PDF pages.");
            } finally {
                setIsRendering(false);
            }
        }
    }, []);

    const addModification = (pageIndex, el) => {
        setModifications(prev => ({
            ...prev,
            [pageIndex]: [...(prev[pageIndex] || []), el]
        }));
    };

    const updateModification = (pageIndex, id, updates) => {
        setModifications(prev => ({
            ...prev,
            [pageIndex]: (prev[pageIndex] || []).map(el => el.id === id ? { ...el, ...updates } : el)
        }));
    };

    const removeModification = (pageIndex, id) => {
        setModifications(prev => ({
            ...prev,
            [pageIndex]: (prev[pageIndex] || []).filter(el => el.id !== id)
        }));
        if (selectedElementId === id) setSelectedElementId(null);
    };

    const handleContainerClick = (e) => {
        if (e.target === containerRef.current) {
            // Clicked directly on the background, drop text here
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const newId = crypto.randomUUID();
            addModification(currentPage, {
                id: newId,
                type: 'text',
                text: 'New Text',
                pctX: x / rect.width,
                pctY: y / rect.height,
                color: '#000000',
                fontSize: 24,
            });
            setSelectedElementId(newId);
        } else {
            // Clicked an element (handled elsewhere) or deselecting
            setSelectedElementId(null);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const newId = crypto.randomUUID();
            addModification(currentPage, {
                id: newId,
                type: 'image',
                dataUrl,
                pctX: 0.35,
                pctY: 0.35,
                pctWidth: 0.3
            });
            setSelectedElementId(newId);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset
    };

    const processFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        try {
            // Format modifications array
            const modsArr = Object.entries(modifications).map(([pageIdx, elements]) => ({
                pageIndex: parseInt(pageIdx),
                elements
            }));

            const blob = await getEditedPdfBlob(file, modsArr);
            setOutputBlob(blob);
        } catch (err) {
            console.error(err);
            setError("Failed to apply edits.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (outputBlob && file) {
            saveAs(outputBlob, `edited_${file.name}`);
        }
    };

    // --- Signature pad minimal implementation ---
    const [isSigModalOpen, setIsSigModalOpen] = useState(false);
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const startDraw = (e) => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const rect = canvasRef.current.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const rect = canvasRef.current.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const endDraw = () => {
        setIsDrawing(false);
    };

    const saveSignature = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const newId = crypto.randomUUID();
            addModification(currentPage, {
                id: newId,
                type: 'signature',
                dataUrl,
                pctX: 0.35,
                pctY: 0.35,
                pctWidth: 0.2
            });
            setSelectedElementId(newId);
        }
        setIsSigModalOpen(false);
    };

    useEffect(() => {
        if (isSigModalOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = 400;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.strokeStyle = "#000000";
        }
    }, [isSigModalOpen]);

    const addText = () => {
        const newId = crypto.randomUUID();
        addModification(currentPage, {
            id: newId,
            type: 'text',
            text: 'Type here',
            pctX: 0.4,
            pctY: 0.4,
            color: '#000000',
            fontSize: 24,
        });
        setSelectedElementId(newId);
    };

    const addImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const addSignature = () => {
        setIsSigModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

            {!file ? (
                <UploadDropzone
                    onFilesAccepted={handleFilesAccepted}
                    accept={{ "application/pdf": [".pdf"] }}
                    title="Drag & Drop PDF to Edit"
                    activeTitle="Drop PDF here"
                    description="Add text, images, and signatures visually"
                />
            ) : isRendering ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                    <p className="font-medium animate-pulse">Rendering PDF pages...</p>
                </div>
            ) : outputBlob ? (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-8 max-w-2xl mx-auto shadow-sm text-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Editing Complete!</h3>
                    <p className="text-sm text-muted-foreground mb-8">Your edited PDF is ready to download.</p>

                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/25"
                    >
                        <Download className="w-5 h-5" />
                        Download Edited PDF
                    </button>
                    <button
                        onClick={() => { setFile(null); setOutputBlob(null); }}
                        className="text-sm text-muted-foreground hover:text-foreground mt-4 underline decoration-muted-foreground/30 underline-offset-4"
                    >
                        Edit another file
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar Toolbar */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                            <h3 className="font-medium text-sm text-muted-foreground mb-4">Add Elements</h3>

                            <button
                                onClick={addText}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
                            >
                                <Type className="w-4 h-4" /> Add Text
                            </button>
                            <button
                                onClick={addImage}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
                            >
                                <ImageIcon className="w-4 h-4" /> Add Image
                            </button>
                            <button
                                onClick={addSignature}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
                            >
                                <PenTool className="w-4 h-4" /> Add Signature
                            </button>
                        </div>

                        {/* Page Navigation */}
                        {pdfPages.length > 1 && (
                            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                                <button
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage(c => Math.max(0, c - 1))}
                                    className="p-2 hover:bg-muted rounded-lg disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-medium">Page {currentPage + 1} of {pdfPages.length}</span>
                                <button
                                    disabled={currentPage === pdfPages.length - 1}
                                    onClick={() => setCurrentPage(c => Math.min(pdfPages.length - 1, c + 1))}
                                    className="p-2 hover:bg-muted rounded-lg disabled:opacity-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={processFile}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/25 disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply Changes & Save"}
                        </button>
                    </div>

                    {/* Main Canvas Area */}
                    <div className="lg:col-span-3">
                        {pdfPages[currentPage] && (
                            <div className="relative border border-border shadow-xl rounded-lg overflow-hidden bg-white mx-auto" style={{ width: 'fit-content' }}>
                                {/* The PDF Page Image */}
                                <img
                                    src={pdfPages[currentPage]}
                                    alt={`Page ${currentPage + 1}`}
                                    className="max-w-full h-auto pointer-events-none"
                                />

                                <div
                                    ref={containerRef}
                                    className="absolute inset-0 z-10 cursor-text"
                                    onClick={handleContainerClick}
                                >
                                    {(modifications[currentPage] || []).map(el => (
                                        <DraggableElement
                                            key={el.id}
                                            el={el}
                                            isSelected={selectedElementId === el.id}
                                            onSelect={() => {
                                                setSelectedElementId(el.id);
                                            }}
                                            onUpdate={(updates) => updateModification(currentPage, el.id, updates)}
                                            onDelete={() => removeModification(currentPage, el.id)}
                                            containerRef={containerRef}
                                            isSelectMode={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Signature Modal */}
            {isSigModalOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Add Signature</h3>
                            <button onClick={() => setIsSigModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                &times;
                            </button>
                        </div>
                        <div className="border border-border rounded-lg bg-white overflow-hidden mb-4">
                            <canvas
                                ref={canvasRef}
                                onPointerDown={startDraw}
                                onPointerMove={draw}
                                onPointerUp={endDraw}
                                onPointerOut={endDraw}
                                className="w-full h-[200px] cursor-crosshair touch-none"
                            />
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-muted-foreground font-medium">Or upload image:</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-600 hover:file:bg-yellow-100 max-w-[200px]"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const newId = crypto.randomUUID();
                                            addModification(currentPage, {
                                                id: newId,
                                                type: 'signature',
                                                dataUrl: ev.target.result,
                                                pctX: 0.35,
                                                pctY: 0.35,
                                                pctWidth: 0.2
                                            });
                                            setSelectedElementId(newId);
                                            setIsSigModalOpen(false);
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                            </div>
                            <div className="flex gap-2 items-end">
                                <button
                                    onClick={() => {
                                        const ctx = canvasRef.current?.getContext('2d');
                                        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                                    }}
                                    className="px-4 py-2 hover:bg-muted rounded-lg text-sm font-medium transition-colors"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={saveSignature}
                                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-yellow-500/20"
                                >
                                    Save Drawing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Child component for a draggable element
function DraggableElement({ el, isSelected, onSelect, onUpdate, onDelete, containerRef, isSelectMode }) {
    const isDragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e) => {
        if (!isSelectMode) return;
        e.stopPropagation();
        onSelect();
        isDragging.current = true;

        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate where inside the element we clicked
        offset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current || !containerRef.current) return;
        e.stopPropagation();

        const containerRect = containerRef.current.getBoundingClientRect();

        let newX = e.clientX - containerRect.left - offset.current.x;
        let newY = e.clientY - containerRect.top - offset.current.y;

        // Ensure it stays within bounds
        newX = Math.max(0, Math.min(newX, containerRect.width));
        newY = Math.max(0, Math.min(newY, containerRect.height));

        onUpdate({
            pctX: newX / containerRect.width,
            pctY: newY / containerRect.height
        });
    };

    const handlePointerUp = (e) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            className={`absolute transition-shadow ${isSelected ? 'ring-2 ring-yellow-500 shadow-xl' : ''}`}
            style={{
                left: `${el.pctX * 100}%`,
                top: `${el.pctY * 100}%`,
                width: el.type === 'text' ? 'auto' : `${el.pctWidth * 100}%`,
                height: el.type === 'text' ? 'auto' : (el.pctHeight ? `${el.pctHeight * 100}%` : 'auto'),
                cursor: isSelectMode ? 'move' : 'default',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => {
                e.stopPropagation();
                if (isSelectMode) onSelect();
            }}
        >
            {isSelected && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg z-20"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}

            {el.type === 'text' ? (
                <div className="relative text-black bg-white/50 backdrop-blur-sm p-1 rounded" style={{ width: 'max-content' }}>
                    <div
                        contentEditable
                        suppressContentEditableWarning
                        spellCheck={false}
                        className="bg-transparent border-none outline-none font-bold"
                        style={{ fontSize: `${el.fontSize || 24}px`, color: el.color, minWidth: '50px' }}
                        onBlur={(e) => onUpdate({ text: e.target.innerText })}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {el.text}
                    </div>
                    {isSelected && (
                        <div className="absolute top-full mt-2 left-0 bg-white shadow-xl rounded-lg border border-border p-2 flex gap-2 z-30 flex-wrap w-48" onClick={e => e.stopPropagation()}>
                            <input
                                type="color"
                                value={el.color || '#000000'}
                                onChange={(e) => onUpdate({ color: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground w-8">Size</span>
                                <input
                                    type="number"
                                    className="w-16 border rounded px-1 text-sm bg-background text-foreground"
                                    value={el.fontSize || 24}
                                    onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (el.type === 'image' || el.type === 'signature') ? (
                <div className="relative group flex w-full h-full">
                    <img
                        src={el.dataUrl}
                        style={{ width: '100%', height: '100%', objectFit: el.pctHeight ? 'fill' : 'contain' }}
                        draggable={false}
                        className="pointer-events-none rounded block"
                        alt="element"
                    />
                    {isSelected && el.type === 'image' && (
                        <div className="absolute top-full mt-2 left-0 bg-white shadow-xl rounded-lg border border-border p-3 z-30 flex flex-col gap-3 min-w-[180px]" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground font-medium">Width</span>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="1.0"
                                    step="0.01"
                                    className="w-24 accent-yellow-500"
                                    value={el.pctWidth}
                                    onChange={(e) => onUpdate({ pctWidth: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground font-medium">Height</span>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="1.0"
                                    step="0.01"
                                    className="w-24 accent-yellow-500"
                                    value={el.pctHeight || el.pctWidth}
                                    onChange={(e) => onUpdate({ pctHeight: Number(e.target.value) })}
                                />
                            </div>
                            <button
                                onClick={() => onUpdate({ pctHeight: null })}
                                className="text-[10px] text-blue-500 hover:text-blue-600 self-end uppercase font-bold tracking-wider"
                            >
                                Reset Auto-Height
                            </button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
