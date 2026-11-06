import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { INDIA_LOCATIONS_DATA } from "../data/indiaLocations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeLocationName = (value) => String(value || "").trim().toLowerCase();

const findLocationState = (name) =>
    INDIA_LOCATIONS_DATA.find(
        (item) => normalizeLocationName(item.state) === normalizeLocationName(name)
    );


// Get all homepage sections
export const getAllHomepageSections = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM homepage_sections
            ORDER BY sort_order ASC, id ASC
        `);

        const parseJSON = (value, fallback = []) => {
            if (!value) return fallback;

            if (typeof value === "object") {
                return value;
            }

            try {
                return JSON.parse(value);
            } catch {
                return fallback;
            }
        };

        const data = rows.map((section) => ({
            ...section,

            trust_cards: parseJSON(section.trust_cards),

            why_features: parseJSON(section.why_features),

            popular_cities: parseJSON(section.popular_cities),

            client_reviews: parseJSON(section.client_reviews)
        }));

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        console.error("Get Homepage Sections Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch homepage sections",
            error: error.message
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


// Create or Upsert homepage section
export const createHomepageSection = async (req, res) => {
    try {
        const {
            section_key,
            title,
            subtitle,
            description,
            button_text,
            button_link,
            overlay_opacity,
            top_badge_text,
            highlight_words,
            trust_cards,
            why_eyebrow,
            why_title,
            why_description,
            why_image,
            stats_number,
            stats_label,
            why_features,
            popular_cities,
            client_reviews,
            is_active,
            sort_order
        } = req.body;

        if (!section_key) {
            return res.status(400).json({
                success: false,
                message: "Section key is required"
            });
        }

        const parseArray = (value) => {
            if (!value) return [];

            if (Array.isArray(value)) return value;

            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        };

        const image = req.file
            ? `/uploads/backgrounds/${req.file.filename}`
            : req.body.background_image || null;

        const values = [
            title,
            subtitle,
            description,
            image,
            button_text,
            button_link,
            is_active === "false" || is_active === false ? 0 : 1,
            Number(sort_order) || 0,
            Number(overlay_opacity ?? 35),
            top_badge_text,
            highlight_words,
            JSON.stringify(parseArray(trust_cards)),
            why_eyebrow,
            why_title,
            why_description,
            why_image,
            stats_number,
            stats_label,
            JSON.stringify(parseArray(why_features)),
            JSON.stringify(parseArray(popular_cities)),
            JSON.stringify(parseArray(client_reviews))
        ];

        const [existing] = await db.query(
            "SELECT id FROM homepage_sections WHERE section_key = ?",
            [section_key]
        );

        if (existing.length > 0) {

            await db.query(`
                UPDATE homepage_sections SET
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
                WHERE id = ?
            `, [...values, existing[0].id]);

            return res.status(200).json({
                success: true,
                message: "Homepage section updated successfully",
                id: existing[0].id
            });
        }

        const [result] = await db.query(`
            INSERT INTO homepage_sections (
                section_key,
                title,
                subtitle,
                description,
                background_image,
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
                stats_number,
                stats_label,
                why_features,
                popular_cities,
                client_reviews
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [section_key, ...values]);

        res.status(201).json({
            success: true,
            message: "Homepage section created successfully",
            id: result.insertId
        });

    } catch (error) {
        console.error("Save Homepage Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save homepage section",
            error: error.message
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
            message: "Failed to update homepage section"
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

// Get the location dataset, optionally filtered by state, city, or search term
export const getStateCitiesAndLocalities = async (req, res) => {
    try {
        const stateFilter = normalizeLocationName(req.query.state);
        const cityFilter = normalizeLocationName(req.query.city);
        const search = normalizeLocationName(req.query.search);

        const data = INDIA_LOCATIONS_DATA
            .filter((item) => !stateFilter || normalizeLocationName(item.state).includes(stateFilter))
            .map((item) => {
                const stateMatchesSearch = search && normalizeLocationName(item.state).includes(search);
                const cities = item.cities
                    .filter((city) => {
                        const cityMatchesSearch = search && normalizeLocationName(city.city).includes(search);
                        const localityMatchesSearch = search && city.localities.some(
                            (locality) => normalizeLocationName(locality).includes(search)
                        );

                        return (!cityFilter || normalizeLocationName(city.city).includes(cityFilter)) &&
                            (!search || stateMatchesSearch || cityMatchesSearch || localityMatchesSearch);
                    })
                    .map((city) => {
                        const cityMatchesSearch = search && normalizeLocationName(city.city).includes(search);
                        const localities = search && !stateMatchesSearch && !cityMatchesSearch
                            ? city.localities.filter((locality) => normalizeLocationName(locality).includes(search))
                            : city.localities;

                        return { city: city.city, localities };
                    });

                return { state: item.state, cities };
            })
            .filter((item) => item.cities.length > 0);

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        console.error("Get Location Data Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch location data" });
    }
};

// Get all states and their city/locality counts
export const getStates = async (_req, res) => {
    try {
        const data = INDIA_LOCATIONS_DATA.map(({ state, cities }) => ({
            state,
            cityCount: cities.length,
            localityCount: cities.reduce((count, city) => count + city.localities.length, 0)
        }));

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        console.error("Get States Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch states" });
    }
};

// Get cities and their localities for a state
export const getCitiesByState = async (req, res) => {
    try {
        const state = findLocationState(req.params.state);

        if (!state) {
            return res.status(404).json({ success: false, message: "State not found" });
        }

        res.status(200).json({ success: true, state: state.state, count: state.cities.length, data: state.cities });
    } catch (error) {
        console.error("Get Cities By State Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch cities" });
    }
};

// Get unique localities across all cities in a state
export const getLocalitiesByState = async (req, res) => {
    try {
        const state = findLocationState(req.params.state);

        if (!state) {
            return res.status(404).json({ success: false, message: "State not found" });
        }

        const data = [...new Set(state.cities.flatMap((city) => city.localities))];
        res.status(200).json({ success: true, state: state.state, count: data.length, data });
    } catch (error) {
        console.error("Get Localities By State Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch localities" });
    }
};

// Get localities for a city, optionally scoped to a state
export const getLocalitiesByCity = async (req, res) => {
    try {
        const cityName = normalizeLocationName(req.params.city);
        const stateName = normalizeLocationName(req.params.state);
        const matches = INDIA_LOCATIONS_DATA
            .filter((state) => !stateName || normalizeLocationName(state.state) === stateName)
            .flatMap((state) => state.cities
                .filter((city) => normalizeLocationName(city.city) === cityName)
                .map((city) => ({ state: state.state, city: city.city, localities: city.localities })));

        if (matches.length === 0) {
            return res.status(404).json({ success: false, message: "City not found" });
        }

        const data = [...new Set(matches.flatMap((match) => match.localities))];
        res.status(200).json({
            success: true,
            city: matches[0].city,
            ...(matches.length === 1 ? { state: matches[0].state } : {}),
            count: data.length,
            data
        });
    } catch (error) {
        console.error("Get Localities By City Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch localities" });
    }
};
