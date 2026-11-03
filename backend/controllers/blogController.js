
import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        fs.unlinkSync(imagePath);
    }
};

// GET ALL BLOGS
export const getAllBlogs = async (req, res) => {
    try {
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

// GET PUBLISHED BLOGS (PUBLIC WEBSITE)
export const getPublishedBlogs = async (req, res) => {
    try {
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
        const {
            title,
            category,
            content,
            author,
            read_time,
            is_published
        } = req.body;

        if (!title || !category || !content) {
            return res.status(400).json({
                success: false,
                message: "Title, category and content are required"
            });
        }

        const coverImage = req.file
            ? getImagePath(req.file.filename)
            : null;

        const published =
            is_published === true ||
            is_published === "true" ||
            is_published === "1" ? 1 : 0;

        const [result] = await db.query(
            `INSERT INTO blogs
            (title, category, cover_image, content,
             author, read_time, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                category,
                coverImage,
                content,
                author || "BilaBadi Editorial Team",
                read_time || "5 min read",
                published
            ]
        );

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            id: result.insertId,
            image: coverImage
        });
    } catch (error) {
        console.error("Create Blog Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create blog"
        });
    }
};

// UPDATE BLOG
export const updateBlog = async (req, res) => {
    try {
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
            : oldBlog.cover_image;

        const published = is_published === undefined
            ? oldBlog.is_published
            : (
                is_published === true ||
                is_published === "true" ||
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
                title ?? oldBlog.title,
                category ?? oldBlog.category,
                coverImage,
                content ?? oldBlog.content,
                author ?? oldBlog.author,
                read_time ?? oldBlog.read_time,
                published,
                id
            ]
        );

        if (req.file && oldBlog.cover_image) {
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
            message: "Failed to update blog"
        });
    }
};

// DELETE BLOG
export const deleteBlog = async (req, res) => {
    try {
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

        deleteImage(rows[0].cover_image);

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully"
        });
    } catch (error) {
        console.error("Delete Blog Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete blog"
        });
    }
};
