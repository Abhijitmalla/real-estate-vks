import express from "express";

import {
    getAllProperties,
    getActiveProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    updatePropertyStatus,
    deleteProperty
} from "../controllers/propertiesController.js";

import createUpload from "../middleware/upload.js";

const router = express.Router();
const upload = createUpload("properties");

// Get all properties (Admin) & Search properties
router.get("/", getAllProperties);
router.get("/search", getAllProperties);

// Get active properties (Public website)
router.get("/public/active", getActiveProperties);

// Get property by ID
router.get("/:id", getPropertyById);

// Create property with cover and multiple images
router.post("/", upload.any(), createProperty);

// Update property with images
router.put("/:id", upload.any(), updateProperty);

// Update active/inactive status
router.patch("/:id/status", updatePropertyStatus);

// Delete property
router.delete("/:id", deleteProperty);

export default router;
