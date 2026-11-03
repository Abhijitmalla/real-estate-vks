
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

import upload from "../middleware/upload.js";

const router = express.Router();

// Admin routes
router.get("/", getAllProperties);
router.get("/public/active", getActiveProperties);
router.get("/:id", getPropertyById);

// Create property with cover and multiple sub-property images
router.post("/", upload.any(), createProperty);

// Update property with images
router.put("/:id", upload.any(), updateProperty);

// Change property active status
router.patch("/:id/status", updatePropertyStatus);

// Delete property
router.delete("/:id", deleteProperty);

export default router;
