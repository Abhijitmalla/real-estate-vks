import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to safely parse JSON strings or return the object/array
const parseJsonField = (val) => {
    if (!val) return null;
    if (typeof val === "object") return val;
    try {
        return JSON.parse(val);
    } catch (e) {
        return val;
    }
};

// Helper to remove any emojis or non-SVG icons from card arrays
const sanitizeCardIcons = (val) => {
    let parsed = parseJsonField(val);
    if (!parsed) return null;
    if (!Array.isArray(parsed)) return parsed;
    return parsed.map(item => {
        if (!item || typeof item !== "object") return item;
        return {
            ...item,
            icon: (item.icon && String(item.icon).includes("<svg")) ? item.icon : ""
        };
    });
};

// Helper to stringify object/array for database storage
const stringifyVal = (val) => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
};

// Helper to format section row with parsed JSON fields
const formatSectionRow = (row) => {
    if (!row) return row;
    return {
        ...row,
        trust_cards: sanitizeCardIcons(row.trust_cards),
        why_features: sanitizeCardIcons(row.why_features),
        popular_cities: parseJsonField(row.popular_cities),
        client_reviews: parseJsonField(row.client_reviews)
    };
};

// Get all homepage sections
export const getAllHomepageSections = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM homepage_sections
             ORDER BY sort_order ASC, id DESC`
        );

        const formattedRows = rows.map(formatSectionRow);

        res.status(200).json({
            success: true,
            count: formattedRows.length,
            data: formattedRows
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

        const formattedRows = rows.map(formatSectionRow);

        res.status(200).json({
            success: true,
            data: formattedRows
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
            data: formatSectionRow(rows[0])
        });

    } catch (error) {
        console.error("Get Homepage Section Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch homepage section"
        });
    }
};

// Create or Upsert homepage section
export const createHomepageSection = async (req, res) => {
    try {
        const {
            section_key = "home",
            title,
            subtitle,
            description,
            button_text,
            button_link,
            is_active,
            sort_order,
            overlay_opacity,
            top_badge_text,
            highlight_words,
            trust_cards,
            why_eyebrow,
            why_title,
            why_description,
            why_image,
            background_image,
            stats_number,
            stats_label,
            why_features,
            popular_cities,
            client_reviews
        } = req.body;

        if (!section_key) {
            return res.status(400).json({
                success: false,
                message: "Section key is required"
            });
        }

        // File uploads
        let uploadedBanner = null;
        let uploadedWhyImage = null;

        if (req.file) {
            uploadedBanner = `/uploads/backgrounds/${req.file.filename}`;
        } else if (req.files) {
            const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            const bFile = filesList.find(f => f.fieldname === "image" || f.fieldname === "background_image");
            if (bFile) uploadedBanner = `/uploads/backgrounds/${bFile.filename}`;
            const wFile = filesList.find(f => f.fieldname === "why_image");
            if (wFile) uploadedWhyImage = `/uploads/backgrounds/${wFile.filename}`;
        }

        const trustCardsVal = stringifyVal(trust_cards);
        const whyFeaturesVal = stringifyVal(why_features);
        const popularCitiesVal = stringifyVal(popular_cities);
        const clientReviewsVal = stringifyVal(client_reviews);

        // Check if section with this key already exists -> if so, update it (upsert)
        const [existing] = await db.query(
            "SELECT * FROM homepage_sections WHERE section_key = ?",
            [section_key]
        );

        if (existing.length > 0) {
            const old = existing[0];
            const finalBannerImage = uploadedBanner || background_image || old.background_image;
            const finalWhyImage = uploadedWhyImage || (why_image !== undefined && why_image !== null && why_image !== "" ? why_image : old.why_image);

            await db.query(
                `UPDATE homepage_sections SET
                    title = ?,
                    subtitle = ?,
                    description = ?,
                    background_image = ?,
                    button_text = ?,
                    button_link = ?,
                    is_active = ?,
                    sort_order = ?,
                    overlay_opacity = ?,
                    top_badge_text = ?,
                    highlight_words = ?,
                    trust_cards = ?,
                    why_eyebrow = ?,
                    why_title = ?,
                    why_description = ?,
                    why_image = ?,
                    stats_number = ?,
                    stats_label = ?,
                    why_features = ?,
                    popular_cities = ?,
                    client_reviews = ?
                WHERE id = ?`,
                [
                    title !== undefined ? title : old.title,
                    subtitle !== undefined ? subtitle : old.subtitle,
                    description !== undefined ? description : old.description,
                    finalBannerImage,
                    button_text !== undefined ? button_text : old.button_text,
                    button_link !== undefined ? button_link : old.button_link,
                    is_active === undefined ? old.is_active : (is_active === "false" || is_active === false || is_active === 0 ? 0 : 1),
                    sort_order !== undefined ? Number(sort_order) : old.sort_order,
                    overlay_opacity !== undefined && overlay_opacity !== null ? overlay_opacity : old.overlay_opacity,
                    top_badge_text !== undefined ? top_badge_text : (subtitle !== undefined ? subtitle : old.top_badge_text),
                    highlight_words !== undefined ? highlight_words : old.highlight_words,
                    trustCardsVal !== null ? trustCardsVal : old.trust_cards,
                    why_eyebrow !== undefined ? why_eyebrow : old.why_eyebrow,
                    why_title !== undefined ? why_title : old.why_title,
                    why_description !== undefined ? why_description : old.why_description,
                    finalWhyImage,
                    stats_number !== undefined ? stats_number : old.stats_number,
                    stats_label !== undefined ? stats_label : old.stats_label,
                    whyFeaturesVal !== null ? whyFeaturesVal : old.why_features,
                    popularCitiesVal !== null ? popularCitiesVal : old.popular_cities,
                    clientReviewsVal !== null ? clientReviewsVal : old.client_reviews,
                    old.id
                ]
            );

            return res.status(200).json({
                success: true,
                message: "Homepage section updated successfully",
                id: old.id,
                image: finalBannerImage,
                why_image: finalWhyImage
            });
        }

        const finalBannerImage = uploadedBanner || background_image || null;
        const finalWhyImage = uploadedWhyImage || why_image || null;

        const [result] = await db.query(
            `INSERT INTO homepage_sections
            (
                section_key, title, subtitle, description,
                background_image, button_text, button_link,
                is_active, sort_order,
                overlay_opacity, top_badge_text, highlight_words,
                trust_cards, why_eyebrow, why_title, why_description,
                why_image, stats_number, stats_label, why_features,
                popular_cities, client_reviews
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                section_key,
                title || null,
                subtitle || null,
                description || null,
                finalBannerImage,
                button_text || null,
                button_link || null,
                is_active === "false" || is_active === false || is_active === 0 ? 0 : 1,
                Number(sort_order) || 0,
                overlay_opacity || null,
                top_badge_text || subtitle || null,
                highlight_words || null,
                trustCardsVal,
                why_eyebrow || null,
                why_title || null,
                why_description || null,
                finalWhyImage,
                stats_number || null,
                stats_label || null,
                whyFeaturesVal,
                popularCitiesVal,
                clientReviewsVal
            ]
        );

        res.status(201).json({
            success: true,
            message: "Homepage section created successfully",
            id: result.insertId,
            image: finalBannerImage,
            why_image: finalWhyImage
        });

    } catch (error) {
        console.error("Create Homepage Section Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save homepage section: " + error.message
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
            sort_order,
            overlay_opacity,
            top_badge_text,
            highlight_words,
            trust_cards,
            why_eyebrow,
            why_title,
            why_description,
            why_image,
            background_image,
            stats_number,
            stats_label,
            why_features,
            popular_cities,
            client_reviews
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

        let uploadedBanner = null;
        let uploadedWhyImage = null;

        if (req.file) {
            uploadedBanner = `/uploads/backgrounds/${req.file.filename}`;
        } else if (req.files) {
            const filesList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            const bFile = filesList.find(f => f.fieldname === "image" || f.fieldname === "background_image");
            if (bFile) uploadedBanner = `/uploads/backgrounds/${bFile.filename}`;
            const wFile = filesList.find(f => f.fieldname === "why_image");
            if (wFile) uploadedWhyImage = `/uploads/backgrounds/${wFile.filename}`;
        }

        const finalBannerImage = uploadedBanner || background_image || oldSection.background_image;
        const finalWhyImage = uploadedWhyImage || (why_image !== undefined && why_image !== null && why_image !== "" ? why_image : oldSection.why_image);

        const trustCardsVal = stringifyVal(trust_cards);
        const whyFeaturesVal = stringifyVal(why_features);
        const popularCitiesVal = stringifyVal(popular_cities);
        const clientReviewsVal = stringifyVal(client_reviews);

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
                sort_order = ?,
                overlay_opacity = ?,
                top_badge_text = ?,
                highlight_words = ?,
                trust_cards = ?,
                why_eyebrow = ?,
                why_title = ?,
                why_description = ?,
                why_image = ?,
                stats_number = ?,
                stats_label = ?,
                why_features = ?,
                popular_cities = ?,
                client_reviews = ?
             WHERE id = ?`,
            [
                section_key || oldSection.section_key,
                title !== undefined ? title : oldSection.title,
                subtitle !== undefined ? subtitle : oldSection.subtitle,
                description !== undefined ? description : oldSection.description,
                finalBannerImage,
                button_text !== undefined ? button_text : oldSection.button_text,
                button_link !== undefined ? button_link : oldSection.button_link,
                is_active === undefined
                    ? oldSection.is_active
                    : (is_active === "true" || is_active === true || is_active === 1 ? 1 : 0),
                sort_order === undefined
                    ? oldSection.sort_order
                    : Number(sort_order),
                overlay_opacity !== undefined ? overlay_opacity : oldSection.overlay_opacity,
                top_badge_text !== undefined ? top_badge_text : (subtitle !== undefined ? subtitle : oldSection.top_badge_text),
                highlight_words !== undefined ? highlight_words : oldSection.highlight_words,
                trustCardsVal !== null ? trustCardsVal : oldSection.trust_cards,
                why_eyebrow !== undefined ? why_eyebrow : oldSection.why_eyebrow,
                why_title !== undefined ? why_title : oldSection.why_title,
                why_description !== undefined ? why_description : oldSection.why_description,
                finalWhyImage,
                stats_number !== undefined ? stats_number : oldSection.stats_number,
                stats_label !== undefined ? stats_label : oldSection.stats_label,
                whyFeaturesVal !== null ? whyFeaturesVal : oldSection.why_features,
                popularCitiesVal !== null ? popularCitiesVal : oldSection.popular_cities,
                clientReviewsVal !== null ? clientReviewsVal : oldSection.client_reviews,
                id
            ]
        );

        // Remove previous image after successful update
        if (uploadedBanner && oldSection.background_image && oldSection.background_image !== uploadedBanner) {
            const oldPath = path.join(
                __dirname,
                "..",
                oldSection.background_image.replace(/^\/+/, "")
            );

            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch (e) {}
            }
        }

        res.status(200).json({
            success: true,
            message: "Homepage section updated successfully",
            image: finalBannerImage,
            why_image: finalWhyImage
        });

    } catch (error) {
        console.error("Update Homepage Section Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update homepage section: " + error.message
        });
    }
};

// Delete homepage section
export const deleteHomepageSection = async (req, res) => {
    try {
        const { id } = req.params;

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

        const section = existing[0];

        await db.query(
            "DELETE FROM homepage_sections WHERE id = ?",
            [id]
        );

        if (section.background_image) {
            const imagePath = path.join(
                __dirname,
                "..",
                section.background_image.replace(/^\/+/, "")
            );

            if (fs.existsSync(imagePath)) {
                try { fs.unlinkSync(imagePath); } catch (e) {}
            }
        }

        if (section.why_image && section.why_image.startsWith("/uploads/")) {
            const whyPath = path.join(
                __dirname,
                "..",
                section.why_image.replace(/^\/+/, "")
            );
            if (fs.existsSync(whyPath)) {
                try { fs.unlinkSync(whyPath); } catch (e) {}
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
            message: "Failed to delete homepage section: " + error.message
        });
    }
};
