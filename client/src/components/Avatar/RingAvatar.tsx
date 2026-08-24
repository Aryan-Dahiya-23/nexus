const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

interface RingAvatarProps {
    imgSrc: string;
    type: string;
}

const RingAvatar: React.FC<RingAvatarProps> = ({ imgSrc, type }) => {
    const size =
        type === "navigation"
            ? "h-8 w-8 md:h-9 md:w-9"
            : type === "incomingVideoCall"
            ? "h-14 w-14"
            : type === "outgoingVideoCall"
            ? "h-60 w-60"
            : "h-24 w-24";

    return (
        <div className={`${size} rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-background overflow-hidden shrink-0 bg-muted`}>
            <img
                src={imgSrc || DEFAULT_AVATAR}
                alt="profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
            />
        </div>
    );
};

export default RingAvatar;
