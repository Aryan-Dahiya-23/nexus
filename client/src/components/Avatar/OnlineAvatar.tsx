interface OnlineAvatarProps {
    height: string;
    width: string;
    imgSrc: string;
}

const sizeClasses: Record<string, string> = {
    "6": "w-6 h-6",
    "7": "w-7 h-7",
    "8": "w-8 h-8",
    "10": "w-10 h-10",
    "12": "w-12 h-12",
    "14": "w-14 h-14",
    "16": "w-16 h-16",
    "20": "w-20 h-20",
    "24": "w-24 h-24",
};

const OnlineAvatar: React.FC<OnlineAvatarProps> = ({ height, width, imgSrc }) => {
    const size = sizeClasses[width] || sizeClasses[height] || "w-12 h-12";

    return (
        <div className="avatar online">
            <div className={`${size} rounded-full overflow-hidden`}>
                <img src={imgSrc} alt="profile" />
            </div>
        </div>
    );
};

export default OnlineAvatar;