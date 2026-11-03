
import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image URL
const propertyImagePath = (filename) =>
    filename ? `/uploads/properties/${filename}` : null;

// Delete uploaded image
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

// ==========================================
// GET ALL PROPERTIES
// ==========================================
export const getAllProperties = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM properties ORDER BY created_at DESC`
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


// ==========================================
// GET ACTIVE PROPERTIES (PUBLIC WEBSITE)
// ==========================================
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


// ==========================================
// GET PROPERTY BY ID
// ==========================================
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


// ==========================================
// CREATE PROPERTY
// ==========================================
export const createProperty = async (req, res) => {
    try {
        const {
            title,
            category,
            badge,
            location,
            price,
            area,
            contact_no,
            transaction_type,
            availability,
            total_plot_area,
            land_area,
            length,
            breadth,
            super_built_up_area,
            built_up_area,
            carpet_area,
            bedrooms,
            balconies,
            furnishing_status,
            facing,
            facing_road_width,
            amenities,
            description,
            is_active
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Property title is required"
            });
        }

        const files = req.files || [];

        // Main cover image
        const coverFile = files.find(
            file => file.fieldname === "cover_image"
        );

        const coverImage = coverFile
            ? propertyImagePath(coverFile.filename)
            : (req.body.property_image || req.body.image || null);

        const active =
            is_active === undefined ||
            is_active === 1 ||
            is_active === true ||
            is_active === "true" ||
            is_active === "1" ? 1 : 0;

        const [result] = await db.query(
            `INSERT INTO properties (
                title,
                category,
                badge,
                location,
                price,
                area,
                contact_no,
                transaction_type,
                availability,
                total_plot_area,
                land_area,
                length,
                breadth,
                super_built_up_area,
                built_up_area,
                carpet_area,
                bedrooms,
                balconies,
                furnishing_status,
                facing,
                facing_road_width,
                amenities,
                description,
                property_image,
                is_active
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            [
                title.trim(),
                category || "Residential Plot",
                badge || "For Sale",
                location || null,
                price || null,
                area || null,
                contact_no || null,
                transaction_type || null,
                availability || null,
                total_plot_area || null,
                land_area || null,
                length || null,
                breadth || null,
                super_built_up_area || null,
                built_up_area || null,
                carpet_area || null,
                bedrooms || null,
                balconies || null,
                furnishing_status || null,
                facing || null,
                facing_road_width || null,
                amenities || null,
                description || null,
                coverImage,
                active
            ]
        );

        res.status(201).json({
            success: true,
            message: "Property created successfully",
            id: result.insertId,
            image: coverImage
        });

    } catch (error) {
        console.error("Create Property Error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to create property"
        });
    }
};


// ==========================================
// UPDATE PROPERTY
// ==========================================
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
        const body = req.body;
        const files = req.files || [];

        // Update cover image
        const coverFile = files.find(
            file => file.fieldname === "cover_image"
        );

        const coverImage = coverFile
            ? propertyImagePath(coverFile.filename)
            : oldProperty.property_image;

        const active = body.is_active === undefined
            ? oldProperty.is_active
            : (
                body.is_active === 1 ||
                body.is_active === true ||
                body.is_active === "true" ||
                body.is_active === "1" ? 1 : 0
            );

        await db.query(
            `UPDATE properties SET
                title = ?,
                category = ?,
                badge = ?,
                location = ?,
                price = ?,
                area = ?,
                contact_no = ?,
                transaction_type = ?,
                availability = ?,
                total_plot_area = ?,
                land_area = ?,
                length = ?,
                breadth = ?,
                super_built_up_area = ?,
                built_up_area = ?,
                carpet_area = ?,
                bedrooms = ?,
                balconies = ?,
                furnishing_status = ?,
                facing = ?,
                facing_road_width = ?,
                amenities = ?,
                description = ?,
                property_image = ?,
                is_active = ?
            WHERE id = ?`,
            [
                body.title ?? oldProperty.title,
                body.category ?? oldProperty.category,
                body.badge ?? oldProperty.badge,
                body.location ?? oldProperty.location,
                body.price ?? oldProperty.price,
                body.area ?? oldProperty.area,
                body.contact_no ?? oldProperty.contact_no,
                body.transaction_type ?? oldProperty.transaction_type,
                body.availability ?? oldProperty.availability,
                body.total_plot_area ?? oldProperty.total_plot_area,
                body.land_area ?? oldProperty.land_area,
                body.length ?? oldProperty.length,
                body.breadth ?? oldProperty.breadth,
                body.super_built_up_area ?? oldProperty.super_built_up_area,
                body.built_up_area ?? oldProperty.built_up_area,
                body.carpet_area ?? oldProperty.carpet_area,
                body.bedrooms ?? oldProperty.bedrooms,
                body.balconies ?? oldProperty.balconies,
                body.furnishing_status ?? oldProperty.furnishing_status,
                body.facing ?? oldProperty.facing,
                body.facing_road_width ?? oldProperty.facing_road_width,
                body.amenities ?? oldProperty.amenities,
                body.description ?? oldProperty.description,
                coverImage,
                active,
                id
            ]
        );

        // Delete old cover image after successful update
        if (coverFile && oldProperty.property_image) {
            deletePropertyImage(oldProperty.property_image);
        }

        res.status(200).json({
            success: true,
            message: "Property updated successfully",
            image: coverImage
        });

    } catch (error) {
        console.error("Update Property Error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to update property"
        });
    }
};


// ==========================================
// UPDATE PROPERTY STATUS
// ==========================================
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
                is_active === 1 ||
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


// ==========================================
// DELETE PROPERTY
// ==========================================
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

        // Delete cover image
        deletePropertyImage(property.property_image);

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
