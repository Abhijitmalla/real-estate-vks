
import express from "express";
import {
    getAllBlogs,
    getPublishedBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog
} from "../controllers/blogController.js";

import upload from "../middleware/upload.js";

const router = express.Router();

// Admin routes
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.post("/", upload.single("cover_image"), createBlog);
router.put("/:id", upload.single("cover_image"), updateBlog);
router.delete("/:id", deleteBlog);

// Public website routes
router.get("/public/published", getPublishedBlogs);

export default router;
