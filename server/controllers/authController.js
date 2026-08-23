import User from "../models/User.js";

export const verify = async (req, res) => {
    try {
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
            const userId = req.user._id;

            const user = await User.findById(userId).lean()
                .populate({
                    path: 'conversations.conversation',
                    select: 'type name participants lastMessage',
                    populate: [
                        {
                            path: 'participants',
                            model: 'User',
                            select: 'fullName picture',
                            match: { _id: { $ne: userId } }
                        },
                        {
                            path: 'lastMessage',
                            model: 'Message',
                            select: 'content type seenBy createdAt senderId'
                        }
                    ]
                })
                .exec();

            if (!user) {
                return res.status(404).json({
                    error: true,
                    message: "User not found",
                });
            }

            if (user.conversations && Array.isArray(user.conversations)) {
                user.conversations.sort((a, b) => {
                    const lastMessageA = a?.conversation?.lastMessage;
                    const lastMessageB = b?.conversation?.lastMessage;

                    if (!lastMessageA && !lastMessageB) return 0;
                    if (!lastMessageA) return 1; // conversations with messages first
                    if (!lastMessageB) return -1;

                    const createdAtA = new Date(lastMessageA.createdAt).getTime();
                    const createdAtB = new Date(lastMessageB.createdAt).getTime();

                    return createdAtB - createdAtA;
                });
            }

            res.status(200).json({
                error: false,
                message: "Successfully Logged In",
                user: user,
            });
        } else {
            res.status(401).json({
                error: true,
                message: "Not Authorized",
                reason: "User is not authenticated.",
            });
        }
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({
            error: true,
            message: "Internal Server Error",
            reason: "An error occurred while verifying user authentication.",
        });
    }
};

export const people = async (req, res) => {
    try {
        const currentUserId = req.user?._id;
        const peopleList = await User.find({ _id: { $ne: currentUserId } })
            .select('_id fullName picture')
            .lean();
        res.status(200).json(peopleList);
    } catch (error) {
        console.error("Error in people endpoint:", error);
        res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};

export const logout = async (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                error: true,
                message: 'Internal Server Error during logout',
            });
        }

        if (req.session) {
            req.session.destroy(() => {
                res.clearCookie('connect.sid');
                res.status(204).end();
            });
        } else {
            res.clearCookie('connect.sid');
            res.status(204).end();
        }
    });
};
