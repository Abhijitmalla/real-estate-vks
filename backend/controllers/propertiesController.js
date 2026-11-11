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

    let state = row.state || null;
    let city = row.city || null;
    let locality = row.locality || null;

    if ((!state || !city) && row.location) {
        const parts = String(row.location).split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
            if (!locality) locality = parts[0];
            if (!city) city = parts[1];
            if (!state) state = parts.slice(2).join(", ");
        } else if (parts.length === 2) {
            if (!city) city = parts[0];
            if (!state) state = parts[1];
        } else if (parts.length === 1) {
            if (!state) state = parts[0];
        }
    }

    return {
        ...row,
        state,
        city,
        locality,
        sub_images: subImages
    };
};

// Helper to dynamically build filter SQL queries based on search parameters
const buildPropertyFilterQuery = (query = {}, defaultOnlyActive = false) => {
    let sql = `SELECT * FROM properties WHERE 1=1`;
    const params = [];

    // Filter active properties
    if (query.is_active !== undefined) {
        const active = (query.is_active === "1" || query.is_active === 1 || query.is_active === "true" || query.is_active === true) ? 1 : 0;
        sql += ` AND is_active = ?`;
        params.push(active);
    } else if (defaultOnlyActive) {
        sql += ` AND is_active = 1`;
    }

    // 1. General search keyword (matches title, location, state, city, locality, category, badge, description)
    const search = (query.search || query.q || query.keyword || "").trim();
    if (search) {
        const parts = search.split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
            // [locality, city, state] -> MUST match locality AND city
            const locality = parts[0];
            const city = parts[1];
            sql += ` AND (locality LIKE ? OR location LIKE ? OR title LIKE ?) AND (city LIKE ? OR location LIKE ?)`;
            params.push(`%${locality}%`, `%${locality}%`, `%${locality}%`, `%${city}%`, `%${city}%`);
        } else if (parts.length === 2) {
            // [city, state] -> match city (Never match whole state)
            const city = parts[0];
            sql += ` AND (city LIKE ? OR location LIKE ? OR title LIKE ?)`;
            params.push(`%${city}%`, `%${city}%`, `%${city}%`);
        } else {
            sql += ` AND (title LIKE ? OR location LIKE ? OR state LIKE ? OR city LIKE ? OR locality LIKE ? OR category LIKE ? OR badge LIKE ? OR description LIKE ?)`;
            const likeVal = `%${search}%`;
            for (let i = 0; i < 8; i++) params.push(likeVal);
        }
    }

    // 2. Location filter (from hero search or URL)
    const location = (query.location || query.loc || "").trim();
    if (location && location !== search) {
        const parts = location.split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
            // [locality, city, state] -> MUST match locality AND city
            const locality = parts[0];
            const city = parts[1];
            sql += ` AND (locality LIKE ? OR location LIKE ?) AND (city LIKE ? OR location LIKE ?)`;
            params.push(`%${locality}%`, `%${locality}%`, `%${city}%`, `%${city}%`);
        } else if (parts.length === 2) {
            // [city, state] -> match city
            const city = parts[0];
            sql += ` AND (city LIKE ? OR location LIKE ?)`;
            params.push(`%${city}%`, `%${city}%`);
        } else if (parts.length === 1) {
            sql += ` AND (location LIKE ? OR state LIKE ? OR city LIKE ? OR locality LIKE ?)`;
            const likeVal = `%${parts[0]}%`;
            params.push(likeVal, likeVal, likeVal, likeVal);
        }
    }

    // 3. Explicit State, City, Locality
    const locality = (query.locality || "").trim();
    if (locality) {
        sql += ` AND (locality LIKE ? OR location LIKE ?)`;
        params.push(`%${locality}%`, `%${locality}%`);
    }

    const city = (query.city || "").trim();
    if (city) {
        sql += ` AND (city LIKE ? OR location LIKE ?)`;
        params.push(`%${city}%`, `%${city}%`);
    }

    const state = (query.state || "").trim();
    if (state && !city && !locality) {
        // Only match whole state if no specific city or locality was provided
        sql += ` AND (state LIKE ? OR location LIKE ?)`;
        params.push(`%${state}%`, `%${state}%`);
    }

    // 4. Property Category / Type
    const category = (query.category || query.type || query.searchType || "").trim();
    if (category && category.toLowerCase() !== "all" && category.toLowerCase() !== "all types") {
        const catLower = category.toLowerCase();
        if (catLower.includes("agri") || catLower.includes("farm")) {
            sql += ` AND (category LIKE '%Agricultural%' OR category LIKE '%Farm%')`;
        } else if (catLower.includes("commercial")) {
            sql += ` AND category LIKE '%Commercial%'`;
        } else if (catLower.includes("residential") || catLower.includes("apartment") || catLower.includes("flat") || catLower.includes("villa")) {
            sql += ` AND (category LIKE '%Residential%' OR category LIKE '%Apartment%' OR category LIKE '%Flat%' OR category LIKE '%Villa%')`;
        } else if (catLower.includes("plot") || catLower.includes("land")) {
            sql += ` AND (category LIKE '%Plot%' OR category LIKE '%Land%')`;
        } else if (catLower.includes("industrial")) {
            sql += ` AND category LIKE '%Industrial%'`;
        } else {
            sql += ` AND category LIKE ?`;
            params.push(`%${category}%`);
        }
    }

    // 5. Price filtering (both budget dropdown ranges and numeric min_price / max_price)
    let minPrice = query.min_price !== undefined && query.min_price !== "" ? parseFloat(query.min_price) : null;
    let maxPrice = query.max_price !== undefined && query.max_price !== "" ? parseFloat(query.max_price) : null;

    const priceRange = (query.searchPrice || query.price || query.price_range || "").trim();
    if (priceRange && priceRange.toLowerCase() !== "any price" && priceRange.toLowerCase() !== "all") {
        const pLower = priceRange.toLowerCase();
        if (pLower.includes("under 25") || pLower.includes("< 25")) {
            maxPrice = 2500000;
        } else if (pLower.includes("25 - 50") || pLower.includes("25 to 50")) {
            minPrice = 2500000;
            maxPrice = 5000000;
        } else if (pLower.includes("< 50") || pLower.includes("under 50")) {
            maxPrice = 5000000;
        } else if (pLower.includes("50 lakh - 1 cr") || pLower.includes("50 l - 1 cr") || pLower.includes("50-100") || pLower.includes("50 to 1")) {
            minPrice = 5000000;
            maxPrice = 10000000;
        } else if (pLower.includes("above 1") || pLower.includes("> 1 cr") || pLower.includes(">1 cr") || pLower.includes("above 1 cr")) {
            minPrice = 10000000;
        }
    }

    if (minPrice !== null && !isNaN(minPrice)) {
        sql += ` AND CAST(REGEXP_REPLACE(price, '[^0-9]', '') AS UNSIGNED) >= ?`;
        params.push(minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
        sql += ` AND CAST(REGEXP_REPLACE(price, '[^0-9]', '') AS UNSIGNED) <= ?`;
        params.push(maxPrice);
    }

    // 6. Bedrooms (BHK)
    const bhk = (query.bedrooms || query.bhk || "").trim();
    if (bhk && bhk.toLowerCase() !== "all" && bhk.toLowerCase() !== "any bhk") {
        if (bhk === "5+" || bhk.toLowerCase().includes("5")) {
            sql += ` AND (bedrooms LIKE '%5%' OR bedrooms LIKE '%6%' OR bedrooms LIKE '%7%' OR bedrooms LIKE '%8%')`;
        } else {
            const num = bhk.replace(/[^0-9]/g, "");
            if (num) {
                sql += ` AND bedrooms LIKE ?`;
                params.push(`%${num}%`);
            } else {
                sql += ` AND bedrooms LIKE ?`;
                params.push(`%${bhk}%`);
            }
        }
    }

    // 7. Furnishing Status
    const furnish = (query.furnishing || query.furnish || query.furnishing_status || "").trim();
    if (furnish && furnish.toLowerCase() !== "all") {
        if (furnish.toLowerCase().includes("semi")) {
            sql += ` AND furnishing_status LIKE '%Semi%'`;
        } else if (furnish.toLowerCase().includes("unfurnish")) {
            sql += ` AND furnishing_status LIKE '%Unfurnished%'`;
        } else if (furnish.toLowerCase().includes("furnish")) {
            sql += ` AND furnishing_status LIKE '%Fully%'`;
        } else {
            sql += ` AND furnishing_status LIKE ?`;
            params.push(`%${furnish}%`);
        }
    }

    // 8. Availability / Status
    const status = (query.status || query.availability || "").trim();
    if (status && status.toLowerCase() !== "all") {
        if (status.toLowerCase().includes("under") || status.toLowerCase().includes("construct")) {
            sql += ` AND availability LIKE '%Construction%'`;
        } else if (status.toLowerCase().includes("ready")) {
            sql += ` AND availability LIKE '%Ready%'`;
        } else {
            sql += ` AND availability LIKE ?`;
            params.push(`%${status}%`);
        }
    }

    // 9. Purpose / Badge (Buy vs Rent)
    const purpose = (query.purpose || query.badge || "").trim();
    if (purpose && purpose.toLowerCase() !== "all") {
        if (purpose.toLowerCase() === "buy" || purpose.toLowerCase().includes("sale")) {
            sql += ` AND badge LIKE '%Sale%'`;
        } else if (purpose.toLowerCase() === "rent") {
            sql += ` AND badge LIKE '%Rent%'`;
        } else {
            sql += ` AND badge LIKE ?`;
            params.push(`%${purpose}%`);
        }
    }

    // 10. Best Property toggle
    if (query.is_best_property !== undefined) {
        const isBest = (query.is_best_property === "1" || query.is_best_property === 1 || query.is_best_property === "true" || query.is_best_property === true) ? 1 : 0;
        sql += ` AND is_best_property = ?`;
        params.push(isBest);
    }

    // 11. Sorting
    const sort = (query.sort || query.sortBy || "").toLowerCase();
    if (sort === "price-low" || sort === "price_asc") {
        sql += ` ORDER BY CAST(REGEXP_REPLACE(price, '[^0-9]', '') AS UNSIGNED) ASC, created_at DESC`;
    } else if (sort === "price-high" || sort === "price_desc") {
        sql += ` ORDER BY CAST(REGEXP_REPLACE(price, '[^0-9]', '') AS UNSIGNED) DESC, created_at DESC`;
    } else if (sort === "area-high") {
        sql += ` ORDER BY CAST(REGEXP_REPLACE(area, '[^0-9]', '') AS UNSIGNED) DESC, created_at DESC`;
    } else {
        sql += ` ORDER BY created_at DESC`;
    }

    return { sql, params };
};

// ==========================================
// GET ALL PROPERTIES
// ==========================================
export const getAllProperties = async (req, res) => {
    try {
        const { sql, params } = buildPropertyFilterQuery(req.query, false);
        const [rows] = await db.query(sql, params);

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
        const { sql, params } = buildPropertyFilterQuery(req.query, true);
        const [rows] = await db.query(sql, params);

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
            state,
            city,
            locality,
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

        let finalState = state ? String(state).trim() : null;
        let finalCity = city ? String(city).trim() : null;
        let finalLocality = locality ? String(locality).trim() : null;
        let finalLocation = location ? String(location).trim() : null;

        if (!finalLocation && (finalLocality || finalCity || finalState)) {
            finalLocation = [finalLocality, finalCity, finalState].filter(Boolean).join(", ");
        }

        if ((!finalState || !finalCity) && finalLocation) {
            const parts = finalLocation.split(",").map(p => p.trim()).filter(Boolean);
            if (parts.length >= 3) {
                if (!finalLocality) finalLocality = parts[0];
                if (!finalCity) finalCity = parts[1];
                if (!finalState) finalState = parts.slice(2).join(", ");
            } else if (parts.length === 2) {
                if (!finalCity) finalCity = parts[0];
                if (!finalState) finalState = parts[1];
            } else if (parts.length === 1) {
                if (!finalState) finalState = parts[0];
            }
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
                    state,
                    city,
                    locality,
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
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )`,
                [
                    title.trim(),
                    category || "Residential Plot",
                    badge || "For Sale",
                    finalLocation || null,
                    finalState || null,
                    finalCity || null,
                    finalLocality || null,
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
                // Ensure columns exist and retry
                try {
                    await db.query(`ALTER TABLE properties ADD COLUMN state VARCHAR(150) NULL AFTER location`);
                    await db.query(`ALTER TABLE properties ADD COLUMN city VARCHAR(150) NULL AFTER state`);
                    await db.query(`ALTER TABLE properties ADD COLUMN locality VARCHAR(150) NULL AFTER city`);
                } catch (e) {}
                try {
                    await db.query(`ALTER TABLE properties ADD COLUMN is_best_property TINYINT(1) DEFAULT 0`);
                } catch (e) {}

                [result] = await db.query(
                    `INSERT INTO properties (
                        title, category, badge, location, state, city, locality,
                        price, area, contact_no, transaction_type, availability,
                        total_plot_area, land_area, length, breadth, super_built_up_area,
                        built_up_area, carpet_area, bedrooms, balconies, furnishing_status,
                        facing, facing_road_width, amenities, description,
                        property_image, sub_images, is_active, is_best_property
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )`,
                    [
                        title.trim(), category || "Residential Plot", badge || "For Sale",
                        finalLocation || null, finalState || null, finalCity || null, finalLocality || null,
                        price || null, area || null, contact_no || null, transaction_type || null,
                        availability || null, total_plot_area || null, land_area || null,
                        length || null, breadth || null, super_built_up_area || null,
                        built_up_area || null, carpet_area || null, bedrooms || null, balconies || null,
                        furnishing_status || null, facing || null, facing_road_width || null,
                        amenities || null, description || null, coverImage,
                        JSON.stringify(parsedSubImages), active, bestProperty
                    ]
                );
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

        let finalState = body.state !== undefined
            ? (body.state ? String(body.state).trim() : null)
            : oldProperty.state;
        let finalCity = body.city !== undefined
            ? (body.city ? String(body.city).trim() : null)
            : oldProperty.city;
        let finalLocality = body.locality !== undefined
            ? (body.locality ? String(body.locality).trim() : null)
            : oldProperty.locality;
        let finalLocation = body.location !== undefined
            ? (body.location ? String(body.location).trim() : null)
            : oldProperty.location;

        if ((body.state !== undefined || body.city !== undefined || body.locality !== undefined) && body.location === undefined) {
            const locParts = [finalLocality, finalCity, finalState].filter(Boolean);
            if (locParts.length > 0) {
                finalLocation = locParts.join(", ");
            }
        }

        try {
            await db.query(
                `UPDATE properties SET
                    title = ?,
                    category = ?,
                    badge = ?,
                    location = ?,
                    state = ?,
                    city = ?,
                    locality = ?,
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
                    finalLocation,
                    finalState,
                    finalCity,
                    finalLocality,
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
                    await db.query(`ALTER TABLE properties ADD COLUMN state VARCHAR(150) NULL AFTER location`);
                    await db.query(`ALTER TABLE properties ADD COLUMN city VARCHAR(150) NULL AFTER state`);
                    await db.query(`ALTER TABLE properties ADD COLUMN locality VARCHAR(150) NULL AFTER city`);
                } catch (e) {}
                try {
                    await db.query(`ALTER TABLE properties ADD COLUMN is_best_property TINYINT(1) DEFAULT 0`);
                } catch (e) {}
                await db.query(
                    `UPDATE properties SET
                        title = ?, category = ?, badge = ?, location = ?, state = ?, city = ?, locality = ?,
                        price = ?, area = ?, contact_no = ?, transaction_type = ?, availability = ?,
                        total_plot_area = ?, land_area = ?, length = ?, breadth = ?,
                        super_built_up_area = ?, built_up_area = ?, carpet_area = ?,
                        bedrooms = ?, balconies = ?, furnishing_status = ?, facing = ?,
                        facing_road_width = ?, amenities = ?, description = ?,
                        property_image = ?, sub_images = ?, is_active = ?, is_best_property = ?
                    WHERE id = ?`,
                    [
                        body.title ?? oldProperty.title, body.category ?? oldProperty.category,
                        body.badge ?? oldProperty.badge, finalLocation, finalState, finalCity, finalLocality,
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
