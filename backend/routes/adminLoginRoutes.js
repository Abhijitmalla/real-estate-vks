
import express from "express";

import {
    adminLogin,
    getAdminProfile,
    changeAdminPassword
} from "../controllers/adminLoginController.js";

import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Public login
router.post("/login", adminLogin);

// Protected routes
router.get("/profile", adminAuth, getAdminProfile);
router.put("/change-password", adminAuth, changeAdminPassword);
router.post("/change-password", adminAuth, changeAdminPassword);

export default router;
