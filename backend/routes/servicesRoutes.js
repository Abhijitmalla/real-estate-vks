import express from "express";
import createUpload from "../middleware/upload.js";

import {
  getAllServices,
  getServiceById,
  createService,
  updateServiceSettings,
  updateService,
  deleteService
} from "../controllers/servicesController.js";

const router = express.Router();
const upload = createUpload("services");

router.get("/", getAllServices);

router.get("/:id", getServiceById);

router.post("/", upload.any(), createService);

router.put("/settings", upload.any(), updateServiceSettings);
router.post("/settings", upload.any(), updateServiceSettings);

router.put("/:id", upload.any(), updateService);

router.delete("/:id", deleteService);

export default router;
