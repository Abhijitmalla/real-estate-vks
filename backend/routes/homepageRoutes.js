import express from "express";

import {
    getAllHomepageSections,
    getHomepage,
    getHomepageSectionById,
    createHomepageSection,
    updateHomepageSection,
    deleteHomepageSection,
    getStateCitiesAndLocalities,
    getStates,
    getCitiesByState,
    getLocalitiesByState,
    getLocalitiesByCity
} from "../controllers/homepageController.js";

import createUpload from "../middleware/upload.js";

const router = express.Router();
const upload = createUpload("backgrounds");

// ==========================================================================
// Location Routes (State -> Cities of State -> Localities of State/City)
// ==========================================================================

// Get all states, their cities and localities (supports ?state=..., ?city=..., ?search=...)
router.get("/locations", getStateCitiesAndLocalities);
router.get("/state-cities-localities", getStateCitiesAndLocalities);

// Get list of all states with city & locality counts
router.get("/states", getStates);

// Get cities of a specific state
router.get("/states/:state/cities", getCitiesByState);

// Get all localities of a specific state
router.get("/states/:state/localities", getLocalitiesByState);

// Get localities of a specific city in a state
router.get("/states/:state/cities/:city/localities", getLocalitiesByCity);

// Get localities of a city directly
router.get("/cities/:city/localities", getLocalitiesByCity);

// ==========================================================================
// Homepage Sections & Settings
// ==========================================================================

// Public routes
router.get("/", getHomepage);
router.get("/sections", getAllHomepageSections);
router.get("/sections/:id", getHomepageSectionById);

// Admin routes
router.post(
    "/sections",
    upload.any(),
    createHomepageSection
);

router.put(
    "/sections/:id",
    upload.any(),
    updateHomepageSection
);

router.delete("/sections/:id", deleteHomepageSection);

export default router;
