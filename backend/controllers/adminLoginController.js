    
import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// ADMIN LOGIN
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const inputPassword = String(password).trim();

        // Query admin directly from database
        const [admins] = await db.query(
            "SELECT * FROM admin_users WHERE LOWER(TRIM(email)) = ? LIMIT 1",
            [cleanEmail]
        );

        if (!admins || admins.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const admin = admins[0];

        if (admin.status && admin.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your admin account is inactive"
            });
        }

        const storedPassword = String(admin.password || "").trim();
        let isMatch = false;

        // 1. Verify bcrypt hash (standard secure hash)
        try {
            isMatch = await bcrypt.compare(inputPassword, storedPassword);
        } catch (e) {
            isMatch = false;
        }

        // 2. Verify plain text (if admin password was entered directly into database)
        if (!isMatch && storedPassword === inputPassword) {
            isMatch = true;
        }

        // 3. Verify MD5 hash (common phpMyAdmin dropdown option)
        if (!isMatch && storedPassword.length === 32) {
            const md5 = crypto.createHash("md5").update(inputPassword).digest("hex");
            if (storedPassword.toLowerCase() === md5.toLowerCase()) {
                isMatch = true;
            }
        }

        // 4. Verify SHA256 hash
        if (!isMatch && storedPassword.length === 64) {
            const sha = crypto.createHash("sha256").update(inputPassword).digest("hex");
            if (storedPassword.toLowerCase() === sha.toLowerCase()) {
                isMatch = true;
            }
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const jwtSecret = process.env.JWT_SECRET || "bilabadi_admin_jwt_secret_key_2026";
        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: "admin"
            },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            admin: {
                id: admin.id,
                name: admin.name || "Administrator",
                email: admin.email
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// GET ADMIN PROFILE
export const getAdminProfile = async (req, res) => {
    try {
        const [admins] = await db.query(
            `SELECT id, name, email, status, created_at
             FROM admin_users WHERE id = ? LIMIT 1`,
            [req.admin.id]
        );

        if (!admins.length || admins[0].status !== "active") {
            return res.status(404).json({
                success: false,
                message: "Admin not found or inactive"
            });
        }

        return res.status(200).json({
            success: true,
            data: admins[0]
        });

    } catch (error) {
        console.error("Get Admin Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// CHANGE ADMIN PASSWORD
export const changeAdminPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, email, adminId } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Both current password and new password are required"
            });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 6 characters"
            });
        }

        // Identify admin by token ID, body adminId, or body email
        const targetId = req.admin?.id || adminId;
        const targetEmail = req.admin?.email || email;

        let query = "";
        let params = [];

        if (targetId) {
            query = "SELECT * FROM admin_users WHERE id = ? LIMIT 1";
            params = [targetId];
        } else if (targetEmail) {
            query = "SELECT * FROM admin_users WHERE LOWER(TRIM(email)) = ? LIMIT 1";
            params = [String(targetEmail).trim().toLowerCase()];
        } else {
            // Default to first active admin
            query = "SELECT * FROM admin_users WHERE status = 'active' ORDER BY id ASC LIMIT 1";
            params = [];
        }

        const [admins] = await db.query(query, params);

        if (!admins.length || admins[0].status !== "active") {
            return res.status(404).json({
                success: false,
                message: "Admin account not found or inactive"
            });
        }

        const admin = admins[0];
        const inputOldPassword = String(oldPassword).trim();
        const storedPassword = String(admin.password || "").trim();

        let isMatch = false;

        // 1. Verify bcrypt hash (standard secure hash)
        try {
            isMatch = await bcrypt.compare(inputOldPassword, storedPassword);
        } catch (e) {
            isMatch = false;
        }

        // 2. Verify plain text (if admin password was entered directly into database)
        if (!isMatch && storedPassword === inputOldPassword) {
            isMatch = true;
        }

        // 3. Verify MD5 hash (common phpMyAdmin dropdown option)
        if (!isMatch && storedPassword.length === 32) {
            const md5 = crypto.createHash("md5").update(inputOldPassword).digest("hex");
            if (storedPassword.toLowerCase() === md5.toLowerCase()) {
                isMatch = true;
            }
        }

        // 4. Verify SHA256 hash
        if (!isMatch && storedPassword.length === 64) {
            const sha = crypto.createHash("sha256").update(inputOldPassword).digest("hex");
            if (storedPassword.toLowerCase() === sha.toLowerCase()) {
                isMatch = true;
            }
        }

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        if (inputOldPassword === String(newPassword).trim()) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);

        await db.query(
            "UPDATE admin_users SET password = ? WHERE id = ?",
            [hashedPassword, admin.id]
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
