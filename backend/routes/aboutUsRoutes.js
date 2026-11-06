import express from "express";
import createUpload from "../middleware/upload.js";
import {
  getAboutPageData,
  handlePostAbout,
  updateAboutSettings,
  createAboutCard,
  updateAboutCard,
  deleteAboutCard
} from "../controllers/aboutUsController.js";

const router = express.Router();
const upload = createUpload("about");

// 1. Get all About Us page data (settings + feature cards) dynamically from DB
router.get("/", getAboutPageData);

// 2. Direct POST to /api/about/
router.post("/", upload.any(), handlePostAbout);

// 3. Settings & Story Image
router.put("/settings", upload.any(), updateAboutSettings);
router.post("/settings", upload.any(), updateAboutSettings);

// 4. Why Choose Feature Cards
router.post("/cards", createAboutCard);
router.put("/cards/:id", updateAboutCard);
router.delete("/cards/:id", deleteAboutCard);

export default router;
