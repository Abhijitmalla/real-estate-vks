
import express from "express";
import {
    getAllBlogs,
    getPublishedBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    uploadBlogInlineImage
} from "../controllers/blogController.js";

import createUpload from "../middleware/upload.js";

const router = express.Router();
const upload = createUpload("blogs");

// Public website routes (must come before /:id)
router.get("/public/published", getPublishedBlogs);
router.get("/published", getPublishedBlogs);

// CKEditor / Inline Image Upload route
router.post("/upload-image", upload.single("upload"), uploadBlogInlineImage);

// Admin & General routes
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.post("/", upload.single("cover_image"), createBlog);
router.put("/:id", upload.single("cover_image"), updateBlog);
router.delete("/:id", deleteBlog);

export default router;
