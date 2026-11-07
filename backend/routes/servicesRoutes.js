import express from "express";
import createUpload from "../middleware/upload.js";

import {
  getAllServices,
  getServiceById,
  createService,
  updateServiceSettings,
  updateService,
  deleteService,
  batchSyncServices
} from "../controllers/servicesController.js";

const router = express.Router();
const upload = createUpload("services");

router.get("/", getAllServices);

router.post("/batch", upload.any(), batchSyncServices);
router.put("/batch", upload.any(), batchSyncServices);

router.put("/settings", upload.any(), updateServiceSettings);
router.post("/settings", upload.any(), updateServiceSettings);

router.get("/:id", getServiceById);

router.post("/", upload.any(), createService);

router.put("/:id", upload.any(), updateService);

router.delete("/:id", deleteService);

export default router;
