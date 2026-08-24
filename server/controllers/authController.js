import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getOnlineUserIds } from "../sockets/chatSockets.js";

export const register = async (req, res) => {
    try {
        const { fullName, email, password, picture } = req.body || {};

        if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
            return res.status(400).json({
                error: true,
                message: "Full name is required",
            });
        }

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({
                error: true,
                message: "Email address is required",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = email.trim().toLowerCase();
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                error: true,
                message: "Please enter a valid email address",
            });
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({
                error: true,
                message: "Password must be at least 6 characters long",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            if (existingUser.password) {
                return res.status(409).json({
                    error: true,
                    message: "An account with this email already exists. Please sign in.",
                });
            } else {
                return res.status(400).json({
                    error: true,
                    message: "This email is associated with a social account. Please sign in using Google or Facebook.",
                });
            }
        }

        // Determine profile picture (use uploaded picture or default generated avatar)
        const cleanFullName = fullName.trim();
        let userPicture = (picture && typeof picture === 'string' && picture.trim()) ? picture.trim() : null;
        if (!userPicture) {
            userPicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanFullName)}&background=0284c7&color=fff&size=256`;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName: cleanFullName,
            email: normalizedEmail,
            password: hashedPassword,
            picture: userPicture,
            conversations: [],
        });

        // Establish passport session
        req.login(newUser, (err) => {
            if (err) {
                console.error("Session login error during registration:", err);
                return res.status(500).json({
                    error: true,
                    message: "Registration succeeded but session could not be established. Please sign in.",
                });
            }

            const sanitizedUser = {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                picture: newUser.picture,
                conversations: newUser.conversations || [],
                createdAt: newUser.createdAt,
            };

            return res.status(201).json({
                error: false,
                message: "Account created successfully",
                user: sanitizedUser,
            });
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred during registration. Please try again.",
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({
                error: true,
                message: "Email address is required",
            });
        }

        if (!password || typeof password !== 'string') {
            return res.status(400).json({
                error: true,
                message: "Password is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                error: true,
                message: "Invalid email or password",
            });
        }

        // Check if user was registered via OAuth only without password
        if (!user.password) {
            return res.status(400).json({
                error: true,
                message: "This account was created using Google or Facebook. Please sign in using your social provider.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                error: true,
                message: "Invalid email or password",
            });
        }

        // Log into passport session
        req.login(user, (err) => {
            if (err) {
                console.error("Session login error during login:", err);
                return res.status(500).json({
                    error: true,
                    message: "Login failed to establish session. Please try again.",
                });
            }

            const sanitizedUser = {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                picture: user.picture,
                conversations: user.conversations || [],
                createdAt: user.createdAt,
            };

            return res.status(200).json({
                error: false,
                message: "Logged in successfully",
                user: sanitizedUser,
            });
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            error: true,
            message: "An error occurred during login. Please try again.",
        });
    }
};

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
            console.error("Passport logout error:", err);
        }

        if (req.session) {
            req.session.destroy((sessionErr) => {
                if (sessionErr) console.error("Session destroy error:", sessionErr);
                res.clearCookie('connect.sid', { path: '/' });
                res.status(204).end();
            });
        } else {
            res.clearCookie('connect.sid', { path: '/' });
            res.status(204).end();
        }
    });
};
