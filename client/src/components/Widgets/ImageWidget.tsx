import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Download, ZoomIn, ZoomOut, RotateCcw, ImageIcon, Loader2 } from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";

const ImageWidget: React.FC = () => {
    const { setImageWidget, imgSrc } = useContext(ThemeContext);
    const [zoom, setZoom] = useState<number>(1);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwyx9715k';

    const isHttpUrl = typeof imgSrc === 'string' && (imgSrc.startsWith('http://') || imgSrc.startsWith('https://'));
    const fullImageUrl = isHttpUrl
        ? imgSrc
        : `https://res.cloudinary.com/${cloudName}/image/upload/q_auto:best,f_auto/${imgSrc}`;

    const isVideo = typeof imgSrc === 'string' && (
        imgSrc.endsWith('.mp4') || imgSrc.endsWith('.webm') || imgSrc.includes('/video/upload/')
    );

    const handleClose = useCallback(() => {
        setImageWidget(false);
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [setImageWidget]);

    const handleZoomIn = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setZoom((prev) => Math.min(prev + 0.5, 3.5));
    };

    const handleZoomOut = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setZoom((prev) => {
            const next = Math.max(prev - 0.5, 1);
            if (next === 1) setPan({ x: 0, y: 0 });
            return next;
        });
    };

    const handleResetZoom = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const toggleZoomClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isVideo) return;
        if (zoom > 1) {
            handleResetZoom();
        } else {
            setZoom(2);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || zoom <= 1) return;
        e.preventDefault();
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(fullImageUrl, { mode: 'cors' });
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `nexus_media_${Date.now()}.${isVideo ? 'mp4' : 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(fullImageUrl, '_blank');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose();
            } else if (e.key === "+" || e.key === "=") {
                setZoom((prev) => Math.min(prev + 0.5, 3.5));
            } else if (e.key === "-" || e.key === "_") {
                setZoom((prev) => {
                    const next = Math.max(prev - 0.5, 1);
                    if (next === 1) setPan({ x: 0, y: 0 });
                    return next;
                });
            } else if (e.key === "0") {
                setZoom(1);
                setPan({ x: 0, y: 0 });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleClose]);

    const widgetContent = (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed inset-0 z-[100] bg-black/94 backdrop-blur-2xl flex flex-col justify-between items-center p-3 sm:p-6 select-none overflow-hidden"
                onClick={handleClose}
            >
                {/* --- TOP FLOATING TOOLBAR --- */}
                <div
                    className="w-full max-w-6xl flex items-center justify-between z-50 pt-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Left: Media Badge */}
                    <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-white text-xs font-semibold shadow-lg">
                        <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                        <span>{isVideo ? "Video Player" : "Media Viewer"}</span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Zoom Controls (Images Only) */}
                        {!isVideo && (
                            <div className="flex items-center bg-white/10 border border-white/10 rounded-full p-1 backdrop-blur-md shadow-lg text-white">
                                <button
                                    type="button"
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 1}
                                    className="p-1.5 rounded-full hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    title="Zoom Out (-)"
                                    aria-label="Zoom Out"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResetZoom}
                                    className="px-2 py-0.5 text-xs font-mono font-medium hover:bg-white/15 rounded-md transition-colors cursor-pointer"
                                    title="Reset Zoom (0)"
                                >
                                    {Math.round(zoom * 100)}%
                                </button>

                                <button
                                    type="button"
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 3.5}
                                    className="p-1.5 rounded-full hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    title="Zoom In (+)"
                                    aria-label="Zoom In"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </button>

                                {zoom !== 1 && (
                                    <button
                                        type="button"
                                        onClick={handleResetZoom}
                                        className="p-1.5 rounded-full hover:bg-white/15 transition-colors cursor-pointer ml-0.5"
                                        title="Reset Zoom"
                                        aria-label="Reset Zoom"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Download Action */}
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="p-2 sm:p-2.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg cursor-pointer flex items-center justify-center"
                            title="Download High-Resolution Media"
                            aria-label="Download Media"
                        >
                            <Download className="h-4 w-4" />
                        </button>

                        {/* Open Original in New Tab */}
                        <a
                            href={fullImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 sm:p-2.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg cursor-pointer flex items-center justify-center"
                            title="Open in Full Window"
                            aria-label="Open Full Resolution"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>

                        {/* Close Lightbox (X) */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-2 sm:p-2.5 rounded-full bg-white/15 border border-white/15 hover:bg-rose-500/80 text-white backdrop-blur-md transition-all shadow-lg cursor-pointer ml-1 group"
                            title="Close [Esc]"
                            aria-label="Close Lightbox"
                        >
                            <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                        </button>
                    </div>
                </div>

                {/* --- CENTER MEDIA STAGE --- */}
                <div
                    ref={containerRef}
                    className="relative w-full h-[76dvh] sm:h-[80dvh] flex items-center justify-center overflow-hidden my-auto"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Loading Spinner */}
                    {!imageLoaded && !isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                        </div>
                    )}

                    {isVideo ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-w-[92vw] max-h-[78dvh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <video
                                src={fullImageUrl}
                                controls
                                autoPlay
                                playsInline
                                className="max-h-[78dvh] max-w-[92vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/15 bg-black"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            animate={{
                                scale: zoom,
                                x: pan.x,
                                y: pan.y,
                            }}
                            transition={{
                                type: isDragging ? false : "spring",
                                stiffness: 300,
                                damping: 28,
                            }}
                            className={`relative max-w-[92vw] max-h-[78dvh] flex items-center justify-center ${
                                zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
                            }`}
                            onClick={toggleZoomClick}
                        >
                            <img
                                src={fullImageUrl}
                                alt="High-resolution preview"
                                onLoad={() => setImageLoaded(true)}
                                className={`max-h-[78dvh] max-w-[92vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/15 select-none transition-opacity duration-200 ${
                                    imageLoaded ? "opacity-100" : "opacity-0"
                                }`}
                                draggable={false}
                            />
                        </motion.div>
                    )}
                </div>

                {/* --- BOTTOM FLOATING BAR --- */}
                <div
                    className="w-full flex items-center justify-center z-50 pb-1 pointer-events-none"
                >
                    <div className="px-3.5 py-1 rounded-full bg-black/60 border border-white/10 text-white/70 text-[11px] font-medium backdrop-blur-md shadow-lg pointer-events-auto">
                        {!isVideo ? (
                            <span>
                                {zoom > 1 ? "Drag to pan • Click or 0 to reset zoom • " : "Click to zoom • "}
                                Press <kbd className="px-1 py-0.5 rounded bg-white/15 font-mono text-[10px] text-white">Esc</kbd> or click outside to close
                            </span>
                        ) : (
                            <span>Press <kbd className="px-1 py-0.5 rounded bg-white/15 font-mono text-[10px] text-white">Esc</kbd> to close</span>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );

    return typeof document !== "undefined" ? createPortal(widgetContent, document.body) : widgetContent;
};

export default ImageWidget;
