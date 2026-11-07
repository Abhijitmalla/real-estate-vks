import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureBlogsTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS blogs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                cover_image TEXT DEFAULT NULL,
                content LONGTEXT NOT NULL,
                author VARCHAR(100) DEFAULT 'BilaBadi Editorial Team',
                read_time VARCHAR(50) DEFAULT '5 min read',
                is_published TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        try {
            await db.query(`ALTER TABLE blogs MODIFY COLUMN cover_image TEXT DEFAULT NULL`);
        } catch (_) {}
    } catch (e) {
        console.warn("Blogs table check warning:", e.message);
    }
};

const getImagePath = (filename) =>
    filename ? `/uploads/blogs/${filename}` : null;

const deleteImage = (imageUrl) => {
    if (!imageUrl) return;

    const filename = path.basename(imageUrl);
    const imagePath = path.join(
        __dirname,
        "../uploads/blogs",
        filename
    );

    if (fs.existsSync(imagePath)) {
        try {
            fs.unlinkSync(imagePath);
        } catch (e) {
            console.warn("Could not delete image file:", e.message);
        }
    }
};

// GET ALL BLOGS (Admin list)
export const getAllBlogs = async (req, res) => {
    try {
        await ensureBlogsTable();
        const [rows] = await db.query(
            `SELECT * FROM blogs ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Get Blogs Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch blogs"
        });
    }
};

// GET PUBLISHED BLOGS (Public website)
export const getPublishedBlogs = async (req, res) => {
    try {
        await ensureBlogsTable();
        const [rows] = await db.query(
            `SELECT * FROM blogs
             WHERE is_published = 1
             ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Get Published Blogs Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch published blogs"
        });
    }
};

// GET BLOG BY ID
export const getBlogById = async (req, res) => {
    try {
        await ensureBlogsTable();
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM blogs WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Get Blog Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch blog"
        });
    }
};

// CREATE BLOG
export const createBlog = async (req, res) => {
    try {
        await ensureBlogsTable();
        const {
            title,
            category,
            content,
            author,
            read_time,
            is_published
        } = req.body;

        const rawContent = content !== undefined && content !== null ? String(content).trim() : '';
        const textContent = rawContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

        if (!title || !category || (!rawContent || (rawContent.startsWith('<p>') && !textContent && !rawContent.includes('<img')))) {
            return res.status(400).json({
                success: false,
                message: "Title, category and content are required"
            });
        }

        const coverImage = req.file
            ? getImagePath(req.file.filename)
            : (req.body.cover_image || req.body.image || null);

        const published =
            is_published === undefined ||
            is_published === true ||
            is_published === "true" ||
            is_published === 1 ||
            is_published === "1" ? 1 : 0;

        const [result] = await db.query(
            `INSERT INTO blogs
            (title, category, cover_image, content,
             author, read_time, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                String(title).trim(),
                String(category).trim(),
                coverImage,
                String(content).trim(),
                String(author || "BilaBadi Editorial Team").trim(),
                String(read_time || "5 min read").trim(),
                published
            ]
        );

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            id: result.insertId,
            image: coverImage,
            data: {
                id: result.insertId,
                title: String(title).trim(),
                category: String(category).trim(),
                cover_image: coverImage,
                content: String(content).trim(),
                author: String(author || "BilaBadi Editorial Team").trim(),
                read_time: String(read_time || "5 min read").trim(),
                is_published: published
            }
        });
    } catch (error) {
        console.error("Create Blog Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create blog"
        });
    }
};

// UPDATE BLOG
export const updateBlog = async (req, res) => {
    try {
        await ensureBlogsTable();
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM blogs WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        const oldBlog = rows[0];

        const {
            title,
            category,
            content,
            author,
            read_time,
            is_published
        } = req.body;

        const coverImage = req.file
            ? getImagePath(req.file.filename)
            : (req.body.cover_image || req.body.image || oldBlog.cover_image);

        const published = is_published === undefined
            ? oldBlog.is_published
            : (
                is_published === true ||
                is_published === "true" ||
                is_published === 1 ||
                is_published === "1" ? 1 : 0
            );

        await db.query(
            `UPDATE blogs SET
                title = ?,
                category = ?,
                cover_image = ?,
                content = ?,
                author = ?,
                read_time = ?,
                is_published = ?
             WHERE id = ?`,
            [
                (title !== undefined ? String(title).trim() : oldBlog.title),
                (category !== undefined ? String(category).trim() : oldBlog.category),
                coverImage,
                (content !== undefined ? String(content).trim() : oldBlog.content),
                (author !== undefined ? String(author).trim() : oldBlog.author),
                (read_time !== undefined ? String(read_time).trim() : oldBlog.read_time),
                published,
                id
            ]
        );

        if (req.file && oldBlog.cover_image && oldBlog.cover_image !== coverImage) {
            deleteImage(oldBlog.cover_image);
        }

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            image: coverImage
        });
    } catch (error) {
        console.error("Update Blog Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update blog"
        });
    }
};

// DELETE BLOG
export const deleteBlog = async (req, res) => {
    try {
        await ensureBlogsTable();
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM blogs WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        await db.query(
            "DELETE FROM blogs WHERE id = ?",
            [id]
        );

        if (rows[0].cover_image) {
            deleteImage(rows[0].cover_image);
        }

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully"
        });
    } catch (error) {
        console.error("Delete Blog Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete blog"
        });
    }
};

// UPLOAD BLOG INLINE IMAGE (For CKEditor or rich article body images)
export const uploadBlogInlineImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                uploaded: false,
                error: { message: "No image file provided" }
            });
        }
        const imageUrl = `http://localhost:5000/uploads/blogs/${req.file.filename}`;
        res.status(200).json({
            url: imageUrl,
            uploaded: true
        });
    } catch (error) {
        console.error("Upload Blog Inline Image Error:", error);
        res.status(500).json({
            uploaded: false,
            error: { message: error.message || "Image upload failed" }
        });
    }
};
