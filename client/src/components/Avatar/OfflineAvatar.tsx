interface OfflineAvatarProps {
    height: string;
    width: string;
    imgSrc: string;
}

const OfflineAvatar: React.FC<OfflineAvatarProps> = ({ height, width, imgSrc }) => {

    return (
        <div className="avatar">
            {/* <div className={`w-${height} h-${width} rounded-full`}> */}
            <div className={`${(height === '6' && width === '6') ? "h-7 w-7" : "h-12 w-12"} rounded-full`}>
                <img src={imgSrc} alt="profile" />
            </div>
        </div>
    );
}

export default OfflineAvatar;
