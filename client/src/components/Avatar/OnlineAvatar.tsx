const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

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
        <div className="relative shrink-0">
            <div className={`${size} rounded-full overflow-hidden ring-1 ring-border/50 bg-muted`}>
                <img
                    src={imgSrc || DEFAULT_AVATAR}
                    alt="profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                />
            </div>
            <span
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs"
                title="Active now"
            />
        </div>
    );
};

export default OnlineAvatar;
