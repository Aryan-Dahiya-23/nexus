interface RingAvatarProps {
    imgSrc: string;
    type: string;
}

const RingAvatar: React.FC<RingAvatarProps> = ({ imgSrc, type }) => {

    return (
        <div className="avatar">
            <div className={`${type === "navigation" ? "h-8 w-8 md:h-9 md:w-9" : type === "incomingVideoCall" ? "h-14 w-14" : type === "outgoingVideoCall" ? "h-60 w-60" : "h-24 w-24"} rounded-full ring ring-primary ring-offset-base-100 ring-offset-2`}>
                <img src={imgSrc} alt="profile" />
            </div>
        </div >
    )
}

export default RingAvatar;