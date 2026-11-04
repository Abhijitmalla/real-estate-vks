import express from "express";

import {
    getAllHomepageSections,
    getHomepage,
    getHomepageSectionById,
    createHomepageSection,
    updateHomepageSection,
    deleteHomepageSection
} from "../controllers/homepageController.js";

import createUpload from "../middleware/upload.js";

const router = express.Router();
const upload = createUpload("backgrounds");

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
