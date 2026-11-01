
import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Get all homepage sections
export const getAllHomepageSections = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM homepage_sections
             ORDER BY sort_order ASC, id DESC`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Get Homepage Sections Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch homepage sections"
        });
    }
};


// Get active homepage sections
export const getHomepage = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM homepage_sections
             WHERE is_active = TRUE
             ORDER BY sort_order ASC, id ASC`
        );

        res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Get Homepage Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch homepage data"
        });
    }
};


// Get homepage section by ID
export const getHomepageSectionById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM homepage_sections WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Homepage section not found"
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Get Homepage Section Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch homepage section"
        });
    }
};


// Create homepage section
export const createHomepageSection = async (req, res) => {
    try {
        const {
            section_key,
            title,
            subtitle,
            description,
            button_text,
            button_link,
            is_active,
            sort_order
        } = req.body;

        if (!section_key) {
            return res.status(400).json({
                success: false,
                message: "Section key is required"
            });
        }

        const image = req.file
            ? `/uploads/backgrounds/${req.file.filename}`
            : null;

        const [result] = await db.query(
            `INSERT INTO homepage_sections
            (
                section_key, title, subtitle, description,
                background_image, button_text, button_link,
                is_active, sort_order
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                section_key,
                title || null,
                subtitle || null,
                description || null,
                image,
                button_text || null,
                button_link || null,
                is_active === "false" ? 0 : 1,
                Number(sort_order) || 0
            ]
        );

        res.status(201).json({
            success: true,
            message: "Homepage section created successfully",
            id: result.insertId,
            image
        });

    } catch (error) {
        console.error("Create Homepage Section Error:", error);

        res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
            success: false,
            message: error.code === "ER_DUP_ENTRY"
                ? "This section key already exists"
                : "Failed to create homepage section"
        });
    }
};


// Update homepage section
export const updateHomepageSection = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            section_key,
            title,
            subtitle,
            description,
            button_text,
            button_link,
            is_active,
            sort_order
        } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM homepage_sections WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Homepage section not found"
            });
        }

        const oldSection = existing[0];

        const image = req.file
            ? `/uploads/backgrounds/${req.file.filename}`
            : oldSection.background_image;

        await db.query(
            `UPDATE homepage_sections SET
                section_key = ?,
                title = ?,
                subtitle = ?,
                description = ?,
                background_image = ?,
                button_text = ?,
                button_link = ?,
                is_active = ?,
                sort_order = ?
             WHERE id = ?`,
            [
                section_key || oldSection.section_key,
                title ?? oldSection.title,
                subtitle ?? oldSection.subtitle,
                description ?? oldSection.description,
                image,
                button_text ?? oldSection.button_text,
                button_link ?? oldSection.button_link,
                is_active === undefined
                    ? oldSection.is_active
                    : (is_active === "true" || is_active === true ? 1 : 0),
                sort_order === undefined
                    ? oldSection.sort_order
                    : Number(sort_order),
                id
            ]
        );

        // Remove previous image after successful update
        if (req.file && oldSection.background_image) {
            const oldPath = path.join(
                __dirname,
                "..",
                oldSection.background_image.replace(/^\/+/, "")
            );

            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        res.status(200).json({
            success: true,
            message: "Homepage section updated successfully",
            image
        });

    } catch (error) {
        console.error("Update Homepage Section Error:", error);

        res.status(500).json({
            success: false,
            message: error.code === "ER_DUP_ENTRY"
                ? "This section key already exists"
                : "Failed to update homepage section"
        });
    }
};


// Delete homepage section
export const deleteHomepageSection = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT background_image FROM homepage_sections WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Homepage section not found"
            });
        }

        await db.query(
            "DELETE FROM homepage_sections WHERE id = ?",
            [id]
        );

        if (rows[0].background_image) {
            const imagePath = path.join(
                __dirname,
                "..",
                rows[0].background_image.replace(/^\/+/, "")
            );

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.status(200).json({
            success: true,
            message: "Homepage section deleted successfully"
        });

    } catch (error) {
        console.error("Delete Homepage Section Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete homepage section"
        });
    }
};
