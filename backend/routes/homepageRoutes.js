
import express from "express";

import {
    getAllHomepageSections,
    getHomepage,
    getHomepageSectionById,
    createHomepageSection,
    updateHomepageSection,
    deleteHomepageSection
} from "../controllers/homepageController.js";

import upload from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getHomepage);
router.get("/sections", getAllHomepageSections);
router.get("/sections/:id", getHomepageSectionById);

// Admin routes
router.post(
    "/sections",
    upload.single("image"),
    createHomepageSection
);

router.put(
    "/sections/:id",
    upload.single("image"),
    updateHomepageSection
);

router.delete("/sections/:id", deleteHomepageSection);

export default router;
