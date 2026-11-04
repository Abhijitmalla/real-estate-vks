import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image URL helper
const propertyImagePath = (filename) =>
    filename ? `/uploads/properties/${filename}` : null;

// Delete uploaded image helper
const deletePropertyImage = (imageUrl) => {
    if (!imageUrl) return;

    const filename = path.basename(imageUrl);
    const imagePath = path.join(
        __dirname,
        "../uploads/properties",
        filename
    );

    if (fs.existsSync(imagePath)) {
        try {
            fs.unlinkSync(imagePath);
        } catch (e) {
            console.warn("Could not delete image file:", imagePath, e.message);
        }
    }
};

// Parse sub_images from request body and multipart files
const parseSubImages = (bodyValue, files = []) => {
    let images = [];

    // Parse from body (JSON string, array, or comma-separated)
    if (typeof bodyValue === "string") {
        try {
            const parsed = JSON.parse(bodyValue);
            if (Array.isArray(parsed)) {
                images = parsed;
            } else if (parsed) {
                images = [parsed];
            }
        } catch {
            images = bodyValue.split(",").map(s => s.trim()).filter(Boolean);
        }
    } else if (Array.isArray(bodyValue)) {
        images = bodyValue;
    }

    // Keep valid string paths/urls
    images = images.filter(img => typeof img === "string" && img.trim().length > 0);

    // Gather any files uploaded with fieldname "sub_images", "sub_images[]", or starting with "sub_image"
    const subFiles = files.filter(file =>
        file.fieldname === "sub_images" ||
        file.fieldname === "sub_images[]" ||
        file.fieldname.startsWith("sub_image")
    );

    const uploadedPaths = subFiles.map(file => propertyImagePath(file.filename));

    return [...uploadedPaths, ...images];
};

// Format property row for API responses
const formatPropertyRow = (row) => {
    if (!row) return row;

    let subImages = [];
    if (row.sub_images) {
        if (Array.isArray(row.sub_images)) {
            subImages = row.sub_images;
        } else if (typeof row.sub_images === "string") {
            try {
                const parsed = JSON.parse(row.sub_images);
                if (Array.isArray(parsed)) subImages = parsed;
                else if (parsed) subImages = [parsed];
            } catch {
                subImages = row.sub_images.split(",").map(s => s.trim()).filter(Boolean);
            }
        }
    }

    return {
        ...row,
        sub_images: subImages
    };
};

// ==========================================
// GET ALL PROPERTIES
// ==========================================
export const getAllProperties = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM properties ORDER BY created_at DESC`
        );

        const formatted = rows.map(formatPropertyRow);

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted
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

        const formatted = rows.map(formatPropertyRow);

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted
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
            data: formatPropertyRow(rows[0])
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

        // Process sub-images
        const parsedSubImages = parseSubImages(
            req.body.sub_images || req.body.existing_sub_images,
            files
        );

        const active =
            is_active === undefined ||
            is_active === 1 ||
            is_active === true ||
            is_active === "true" ||
            is_active === "1" ? 1 : 0;

        const bestProperty = (
            req.body.is_best_property === 1 ||
            req.body.is_best_property === true ||
            req.body.is_best_property === "1" ||
            req.body.is_best_property === "true"
        ) ? 1 : 0;

        let result;
        try {
            [result] = await db.query(
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
                    sub_images,
                    is_active,
                    is_best_property
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
                    JSON.stringify(parsedSubImages),
                    active,
                    bestProperty
                ]
            );
        } catch (dbErr) {
            if (dbErr.code === "ER_BAD_FIELD_ERROR") {
                try {
                    await db.query(`ALTER TABLE properties ADD COLUMN is_best_property TINYINT(1) DEFAULT 0`);
                    [result] = await db.query(
                        `INSERT INTO properties (
                            title, category, badge, location, price, area, contact_no,
                            transaction_type, availability, total_plot_area, land_area,
                            length, breadth, super_built_up_area, built_up_area,
                            carpet_area, bedrooms, balconies, furnishing_status,
                            facing, facing_road_width, amenities, description,
                            property_image, sub_images, is_active, is_best_property
                        ) VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                        )`,
                        [
                            title.trim(), category || "Residential Plot", badge || "For Sale",
                            location || null, price || null, area || null, contact_no || null,
                            transaction_type || null, availability || null, total_plot_area || null,
                            land_area || null, length || null, breadth || null, super_built_up_area || null,
                            built_up_area || null, carpet_area || null, bedrooms || null, balconies || null,
                            furnishing_status || null, facing || null, facing_road_width || null,
                            amenities || null, description || null, coverImage,
                            JSON.stringify(parsedSubImages), active, bestProperty
                        ]
                    );
                } catch {
                    [result] = await db.query(
                        `INSERT INTO properties (
                            title, category, badge, location, price, area, contact_no,
                            transaction_type, availability, total_plot_area, land_area,
                            length, breadth, super_built_up_area, built_up_area,
                            carpet_area, bedrooms, balconies, furnishing_status,
                            facing, facing_road_width, amenities, description,
                            property_image, sub_images, is_active
                        ) VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                        )`,
                        [
                            title.trim(), category || "Residential Plot", badge || "For Sale",
                            location || null, price || null, area || null, contact_no || null,
                            transaction_type || null, availability || null, total_plot_area || null,
                            land_area || null, length || null, breadth || null, super_built_up_area || null,
                            built_up_area || null, carpet_area || null, bedrooms || null, balconies || null,
                            furnishing_status || null, facing || null, facing_road_width || null,
                            amenities || null, description || null, coverImage,
                            JSON.stringify(parsedSubImages), active
                        ]
                    );
                }
            } else {
                throw dbErr;
            }
        }

        res.status(201).json({
            success: true,
            message: "Property created successfully",
            id: result.insertId,
            image: coverImage,
            sub_images: parsedSubImages
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
            : (body.property_image || body.image || oldProperty.property_image);

        // Process sub-images
        let finalSubImages = [];
        const hasSubFiles = files.some(
            file => file.fieldname === "sub_images" || file.fieldname === "sub_images[]" || file.fieldname.startsWith("sub_image")
        );

        if (body.sub_images !== undefined || body.existing_sub_images !== undefined || hasSubFiles) {
            finalSubImages = parseSubImages(
                body.sub_images || body.existing_sub_images,
                files
            );
        } else if (oldProperty.sub_images) {
            finalSubImages = parseSubImages(oldProperty.sub_images);
        }

        const active = body.is_active === undefined
            ? oldProperty.is_active
            : (
                body.is_active === 1 ||
                body.is_active === true ||
                body.is_active === "true" ||
                body.is_active === "1" ? 1 : 0
            );

        const bestProperty = body.is_best_property !== undefined
            ? (
                body.is_best_property === 1 ||
                body.is_best_property === true ||
                body.is_best_property === "true" ||
                body.is_best_property === "1" ? 1 : 0
            )
            : (oldProperty.is_best_property ? 1 : 0);

        try {
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
                    sub_images = ?,
                    is_active = ?,
                    is_best_property = ?
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
                    JSON.stringify(finalSubImages),
                    active,
                    bestProperty,
                    id
                ]
            );
        } catch (updateErr) {
            if (updateErr.code === "ER_BAD_FIELD_ERROR") {
                try {
                    await db.query(`ALTER TABLE properties ADD COLUMN is_best_property TINYINT(1) DEFAULT 0`);
                    await db.query(
                        `UPDATE properties SET
                            title = ?, category = ?, badge = ?, location = ?, price = ?,
                            area = ?, contact_no = ?, transaction_type = ?, availability = ?,
                            total_plot_area = ?, land_area = ?, length = ?, breadth = ?,
                            super_built_up_area = ?, built_up_area = ?, carpet_area = ?,
                            bedrooms = ?, balconies = ?, furnishing_status = ?, facing = ?,
                            facing_road_width = ?, amenities = ?, description = ?,
                            property_image = ?, sub_images = ?, is_active = ?, is_best_property = ?
                        WHERE id = ?`,
                        [
                            body.title ?? oldProperty.title, body.category ?? oldProperty.category,
                            body.badge ?? oldProperty.badge, body.location ?? oldProperty.location,
                            body.price ?? oldProperty.price, body.area ?? oldProperty.area,
                            body.contact_no ?? oldProperty.contact_no, body.transaction_type ?? oldProperty.transaction_type,
                            body.availability ?? oldProperty.availability, body.total_plot_area ?? oldProperty.total_plot_area,
                            body.land_area ?? oldProperty.land_area, body.length ?? oldProperty.length,
                            body.breadth ?? oldProperty.breadth, body.super_built_up_area ?? oldProperty.super_built_up_area,
                            body.built_up_area ?? oldProperty.built_up_area, body.carpet_area ?? oldProperty.carpet_area,
                            body.bedrooms ?? oldProperty.bedrooms, body.balconies ?? oldProperty.balconies,
                            body.furnishing_status ?? oldProperty.furnishing_status, body.facing ?? oldProperty.facing,
                            body.facing_road_width ?? oldProperty.facing_road_width, body.amenities ?? oldProperty.amenities,
                            body.description ?? oldProperty.description, coverImage,
                            JSON.stringify(finalSubImages), active, bestProperty, id
                        ]
                    );
                } catch {
                    await db.query(
                        `UPDATE properties SET
                            title = ?, category = ?, badge = ?, location = ?, price = ?,
                            area = ?, contact_no = ?, transaction_type = ?, availability = ?,
                            total_plot_area = ?, land_area = ?, length = ?, breadth = ?,
                            super_built_up_area = ?, built_up_area = ?, carpet_area = ?,
                            bedrooms = ?, balconies = ?, furnishing_status = ?, facing = ?,
                            facing_road_width = ?, amenities = ?, description = ?,
                            property_image = ?, sub_images = ?, is_active = ?
                        WHERE id = ?`,
                        [
                            body.title ?? oldProperty.title, body.category ?? oldProperty.category,
                            body.badge ?? oldProperty.badge, body.location ?? oldProperty.location,
                            body.price ?? oldProperty.price, body.area ?? oldProperty.area,
                            body.contact_no ?? oldProperty.contact_no, body.transaction_type ?? oldProperty.transaction_type,
                            body.availability ?? oldProperty.availability, body.total_plot_area ?? oldProperty.total_plot_area,
                            body.land_area ?? oldProperty.land_area, body.length ?? oldProperty.length,
                            body.breadth ?? oldProperty.breadth, body.super_built_up_area ?? oldProperty.super_built_up_area,
                            body.built_up_area ?? oldProperty.built_up_area, body.carpet_area ?? oldProperty.carpet_area,
                            body.bedrooms ?? oldProperty.bedrooms, body.balconies ?? oldProperty.balconies,
                            body.furnishing_status ?? oldProperty.furnishing_status, body.facing ?? oldProperty.facing,
                            body.facing_road_width ?? oldProperty.facing_road_width, body.amenities ?? oldProperty.amenities,
                            body.description ?? oldProperty.description, coverImage,
                            JSON.stringify(finalSubImages), active, id
                        ]
                    );
                }
            } else {
                throw updateErr;
            }
        }

        // Delete old cover image after successful update if replaced
        if (coverFile && oldProperty.property_image && oldProperty.property_image !== coverImage) {
            deletePropertyImage(oldProperty.property_image);
        }

        res.status(200).json({
            success: true,
            message: "Property updated successfully",
            image: coverImage,
            sub_images: finalSubImages
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
        if (property.property_image) {
            deletePropertyImage(property.property_image);
        }

        // Delete sub-images
        if (property.sub_images) {
            try {
                const subImages = typeof property.sub_images === "string"
                    ? JSON.parse(property.sub_images)
                    : property.sub_images;
                if (Array.isArray(subImages)) {
                    subImages.forEach(img => {
                        if (img && img.startsWith("/uploads/properties/")) {
                            deletePropertyImage(img);
                        }
                    });
                }
            } catch (e) {}
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
