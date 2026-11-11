
import jwt from "jsonwebtoken";

const adminAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const secret = process.env.JWT_SECRET || "bilabadi_admin_jwt_secret_key_2026";

            try {
                const decoded = jwt.verify(token, secret);
                if (decoded && decoded.role === "admin") {
                    req.admin = decoded;
                    return next();
                }
            } catch (err) {
                // If token invalid/expired, check if change-password fallback applies
                if (req.body && req.body.oldPassword && (req.body.email || req.body.adminId)) {
                    return next();
                }
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token"
                });
            }
        }

        // Fallback for change-password: if client provides credentials in body, let controller verify
        if (req.body && req.body.oldPassword && (req.body.email || req.body.adminId)) {
            return next();
        }

        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

export default adminAuth;
