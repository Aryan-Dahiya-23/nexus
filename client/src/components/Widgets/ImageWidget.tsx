import React, { useContext, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { ThemeContext } from "../../contexts/ThemeContext";

const ImageWidget: React.FC = () => {
    const cld = new Cloudinary({
        cloud: {
            cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }
    });

    const { setImageWidget, imgSrc } = useContext(ThemeContext);

    const myImg = cld.image(imgSrc);

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

    return (
        <div
            className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <button
                type="button"
                className="absolute right-4 top-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
                onClick={handleClose}
                aria-label="Close Lightbox"
            >
                <X className="h-6 w-6" />
            </button>

            <div
                className="relative max-w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <AdvancedImage
                    className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
                    cldImg={myImg}
                />
            </div>
        </div>
    );
};

export default ImageWidget;
