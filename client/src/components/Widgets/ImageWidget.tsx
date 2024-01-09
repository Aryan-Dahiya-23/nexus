import { useContext } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react"
import { ThemeContext } from "../../contexts/ThemeContext";

const ImageWidget = () => {

    const cld = new Cloudinary({
        cloud: {
            cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }
    });

    const { setImageWidget } = useContext(ThemeContext);
    const { imgSrc } = useContext(ThemeContext);

    const myImg = cld.image(imgSrc);

    const handleClose = () => {
        setImageWidget(false);
    }

    return (
        <div className="flex justify-center items-center h-full w-full fixed z-[9999] bg-gray-700">

            <button className="btn btn-sm btn-circle btn-ghost text-white absolute right-1 top-1" onClick={handleClose}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <AdvancedImage
                className="max-h-[95%] lg:max-w-[95%] object-contain rounded-md lg:rounded-lg"
                cldImg={myImg}
            />

        </div>
    )
}

export default ImageWidget