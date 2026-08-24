import React, { useContext, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { ThemeContext } from "../../contexts/ThemeContext";

const ImageWidget: React.FC = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwyx9715k';
    const cld = new Cloudinary({
        cloud: { cloudName }
    });

    const { setImageWidget, imgSrc } = useContext(ThemeContext);

    const isHttpUrl = typeof imgSrc === 'string' && (imgSrc.startsWith('http://') || imgSrc.startsWith('https://'));
    const fullImageUrl = isHttpUrl
        ? imgSrc
        : `https://res.cloudinary.com/${cloudName}/image/upload/${imgSrc}`;

    const myImg = !isHttpUrl ? cld.image(imgSrc) : null;

    const handleClose = useCallback(() => {
        setImageWidget(false);
    }, [setImageWidget]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleClose]);

    const widgetContent = (
        <div
            className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-lg flex items-center justify-center p-3 sm:p-8 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            {/* Top Toolbar */}
            <div
                className="absolute top-4 right-4 flex items-center space-x-2 z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <a
                    href={fullImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Open Full Resolution"
                    download
                >
                    <ExternalLink className="h-4.5 w-4.5" />
                </a>

                <button
                    type="button"
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    onClick={handleClose}
                    aria-label="Close Lightbox"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Lightbox Center Image */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative max-w-full max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {isHttpUrl ? (
                    <img
                        src={imgSrc}
                        alt="Enlarged media"
                        className="max-h-[88dvh] max-w-[92vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/15"
                    />
                ) : myImg ? (
                    <AdvancedImage
                        className="max-h-[88dvh] max-w-[92vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/15"
                        cldImg={myImg}
                    />
                ) : (
                    <img
                        src={fullImageUrl}
                        alt="Enlarged media"
                        className="max-h-[88dvh] max-w-[92vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/15"
                    />
                )}
            </motion.div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(widgetContent, document.body) : widgetContent;
};

export default ImageWidget;
