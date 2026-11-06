import express from "express";
import createUpload from "../middleware/upload.js";
import {
  getContactPageData,
  updateContactSettings,
  createContactCard,
  updateContactCard,
  deleteContactCard,
  createContactLocation,
  updateContactLocation,
  deleteContactLocation,
  submitInquiry,
  updateInquiryStatus,
  deleteInquiry
} from "../controllers/contactUsController.js";

const router = express.Router();
const upload = createUpload("contact");

// 1. Get all contact page data
router.get("/", getContactPageData);

// 2. Settings & Hero Image
router.put("/settings", upload.any(), updateContactSettings);
router.post("/settings", upload.any(), updateContactSettings);

// 3. Action / Help Cards
router.post("/cards", upload.any(), createContactCard);
router.put("/cards/:id", upload.any(), updateContactCard);
router.delete("/cards/:id", deleteContactCard);

// 4. Office Locations & Building photos
router.post("/locations", upload.any(), createContactLocation);
router.put("/locations/:id", upload.any(), updateContactLocation);
router.delete("/locations/:id", deleteContactLocation);

// 5. Inquiries
router.post("/inquiries", submitInquiry);
router.put("/inquiries/:id", updateInquiryStatus);
router.delete("/inquiries/:id", deleteInquiry);

export default router;

