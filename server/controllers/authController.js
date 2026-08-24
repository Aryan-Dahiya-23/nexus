import User from "../models/User.js";
import { getOnlineUserIds } from "../sockets/chatSockets.js";

export const verify = async (req, res) => {
    try {
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
            const userId = req.user._id;

            const user = await User.findById(userId)
                .select('-password')
                .lean()
                .populate({
                    path: 'conversations.conversation',
                    select: 'type name participants lastMessage updatedAt',
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
                // Filter out any dangling references where conversation failed to populate
                user.conversations = user.conversations.filter(
                    (entry) => entry && entry.conversation && (entry.conversation._id || typeof entry.conversation === 'object')
                );

                // Sort by lastMessage createdAt descending, falling back to conversation updatedAt
                user.conversations.sort((a, b) => {
                    const lastMessageA = a?.conversation?.lastMessage;
                    const lastMessageB = b?.conversation?.lastMessage;

                    const timeA = lastMessageA?.createdAt
                        ? new Date(lastMessageA.createdAt).getTime()
                        : (a?.conversation?.updatedAt ? new Date(a.conversation.updatedAt).getTime() : 0);

                    const timeB = lastMessageB?.createdAt
                        ? new Date(lastMessageB.createdAt).getTime()
                        : (b?.conversation?.updatedAt ? new Date(b.conversation.updatedAt).getTime() : 0);

                    return timeB - timeA;
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
        if (!currentUserId) {
            return res.status(401).json({
                error: true,
                message: "Authentication required",
            });
        }

        const rawPage = parseInt(req.query.page, 10);
        const page = (!isNaN(rawPage) && rawPage >= 1) ? rawPage : 1;

        const rawLimit = parseInt(req.query.limit, 10);
        let limit = !isNaN(rawLimit) ? rawLimit : 20;
        if (limit > 50) limit = 50;
        if (limit < 1) limit = 1;

        const skip = (page - 1) * limit;

        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const tab = req.query.tab === 'online' ? 'online' : 'all';

        const filter = {
            _id: { $ne: currentUserId },
        };

        if (tab === 'online') {
            const onlineUserIds = getOnlineUserIds();
            filter._id = {
                $ne: currentUserId,
                $in: onlineUserIds,
            };
        }

        if (search) {
            const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.fullName = { $regex: new RegExp(sanitizedSearch, 'i') };
        }

        const totalUsers = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('_id fullName picture')
            .sort({ fullName: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalPages = totalUsers > 0 ? Math.ceil(totalUsers / limit) : 0;
        const hasMore = page < totalPages;

        res.status(200).json({
            error: false,
            users,
            totalUsers,
            totalPages,
            currentPage: page,
            hasMore,
        });
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
