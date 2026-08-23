/**
 * Authentication verification middleware.
 * Ensures the requesting client has an active authenticated session.
 */
export const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return next();
    }
    return res.status(401).json({
        error: true,
        message: "Unauthorized: Please log in to access this resource.",
    });
};
