
import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const propertyImagePath = (filename) =>
    filename ? `/uploads/properties/${filename}` : null;

const deletePropertyImage = (imageUrl) => {
    if (!imageUrl) return;

    const filename = path.basename(imageUrl);
    const imagePath = path.join(
        __dirname,
        "../uploads/properties",
        filename
    );

    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }
};

const parseSubProperties = (value, files = []) => {
    let subProperties = [];

    if (typeof value === "string") {
        try {
            subProperties = JSON.parse(value);
        } catch {
            throw new Error("Invalid sub_properties JSON");
        }
    } else if (Array.isArray(value)) {
        subProperties = value;
    }

    if (!Array.isArray(subProperties)) {
        throw new Error("sub_properties must be an array");
    }

    return subProperties.map((sub, index) => {
        const galleryFiles = files
            .filter(file =>
                file.fieldname === `sub_property_images_${index}`
            )
            .map(file => propertyImagePath(file.filename));

        return {
            name: sub.name || "",
            type: sub.type || "",
            area: sub.area || "",
            price: sub.price || "",
            facing: sub.facing || "",
            status: sub.status || "Available",
            images: [
                ...(Array.isArray(sub.images) ? sub.images : []),
                ...galleryFiles
            ]
        };
    });
};

// GET ALL PROPERTIES
export const getAllProperties = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM properties
             ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Get Properties Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch properties"
        });
    }
};

// GET ACTIVE PROPERTIES (PUBLIC WEBSITE)
export const getActiveProperties = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM properties
             WHERE is_active = 1
             ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Get Active Properties Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch active properties"
        });
    }
};

// GET PROPERTY BY ID
export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM properties WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Get Property Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch property"
        });
    }
};

// CREATE PROPERTY
export const createProperty = async (req, res) => {
    try {
        const {
            title,
            category,
            badge,
            location,
            price,
            area,
            sub_properties,
            is_active
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Property title is required"
            });
        }

        const files = req.files || [];

        const coverFile = files.find(
            file => file.fieldname === "cover_image"
        );

        const coverImage = coverFile
            ? propertyImagePath(coverFile.filename)
            : null;

        const parsedSubProperties = parseSubProperties(
            sub_properties,
            files
        );

        const active =
            is_active === undefined ||
            is_active === true ||
            is_active === "true" ||
            is_active === "1" ? 1 : 0;

        const [result] = await db.query(
            `INSERT INTO properties
            (
                title,
                category,
                badge,
                location,
                price,
                area,
                property_image,
                sub_properties,
                is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                category || "Residential Plot",
                badge || "For Sale",
                location || null,
                price || null,
                area || null,
                coverImage,
                JSON.stringify(parsedSubProperties),
                active
            ]
        );

        res.status(201).json({
            success: true,
            message: "Property created successfully",
            id: result.insertId,
            image: coverImage,
            sub_properties: parsedSubProperties
        });
    } catch (error) {
        console.error("Create Property Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create property"
        });
    }
};

// UPDATE PROPERTY
export const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM properties WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const oldProperty = rows[0];
        const files = req.files || [];

        const coverFile = files.find(
            file => file.fieldname === "cover_image"
        );

        const coverImage = coverFile
            ? propertyImagePath(coverFile.filename)
            : oldProperty.property_image;

        let finalSubProperties;

        if (req.body.sub_properties !== undefined) {
            finalSubProperties = parseSubProperties(
                req.body.sub_properties,
                files
            );
        } else {
            finalSubProperties =
                typeof oldProperty.sub_properties === "string"
                    ? JSON.parse(oldProperty.sub_properties || "[]")
                    : oldProperty.sub_properties || [];
        }

        const active = req.body.is_active === undefined
            ? oldProperty.is_active
            : (
                req.body.is_active === true ||
                req.body.is_active === "true" ||
                req.body.is_active === "1" ? 1 : 0
            );

        await db.query(
            `UPDATE properties SET
                title = ?,
                category = ?,
                badge = ?,
                location = ?,
                price = ?,
                area = ?,
                property_image = ?,
                sub_properties = ?,
                is_active = ?
             WHERE id = ?`,
            [
                req.body.title ?? oldProperty.title,
                req.body.category ?? oldProperty.category,
                req.body.badge ?? oldProperty.badge,
                req.body.location ?? oldProperty.location,
                req.body.price ?? oldProperty.price,
                req.body.area ?? oldProperty.area,
                coverImage,
                JSON.stringify(finalSubProperties),
                active,
                id
            ]
        );

        if (coverFile && oldProperty.property_image) {
            deletePropertyImage(oldProperty.property_image);
        }

        res.status(200).json({
            success: true,
            message: "Property updated successfully",
            image: coverImage,
            sub_properties: finalSubProperties
        });
    } catch (error) {
        console.error("Update Property Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update property"
        });
    }
};

// UPDATE PROPERTY STATUS
export const updatePropertyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (is_active === undefined) {
            return res.status(400).json({
                success: false,
                message: "is_active is required"
            });
        }

        const [result] = await db.query(
            `UPDATE properties SET is_active = ?
             WHERE id = ?`,
            [
                is_active === true ||
                is_active === "true" ||
                is_active === "1" ? 1 : 0,
                id
            ]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Property status updated successfully"
        });
    } catch (error) {
        console.error("Update Property Status Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update property status"
        });
    }
};

// DELETE PROPERTY
export const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM properties WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const property = rows[0];

        await db.query(
            "DELETE FROM properties WHERE id = ?",
            [id]
        );

        // Delete main cover image
        deletePropertyImage(property.property_image);

        // Delete sub-property gallery images
        let subProperties = property.sub_properties;

        if (typeof subProperties === "string") {
            subProperties = JSON.parse(subProperties || "[]");
        }

        for (const sub of subProperties || []) {
            for (const image of sub.images || []) {
                if (typeof image === "string" &&
                    image.startsWith("/uploads/properties/")) {
                    deletePropertyImage(image);
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Property deleted successfully"
        });
    } catch (error) {
        console.error("Delete Property Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete property"
        });
    }
};
