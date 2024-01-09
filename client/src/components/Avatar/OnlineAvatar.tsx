interface OnlineAvatarProps {
    height: string;
    width: string;
    imgSrc: string;
}

const OnlineAvatar: React.FC<OnlineAvatarProps> = ({ height, width, imgSrc }) => {
    return (
        <div className="avatar online ">
            <div className={`w-${width} h-${height} rounded-full`}>
            {/* <div className={`w-12 h-12 rounded-full`}> */}

                <img src={imgSrc} alt="profile" />
            </div>
        </div>
    );
}

export default OnlineAvatar;