
import express from "express";

import {
  getAllServices,
  getServiceById,
  createService,
  updateServiceSettings,
  updateService,
  deleteService
} from "../controllers/servicesController.js";

const router = express.Router();

router.get("/", getAllServices);

router.get("/:id", getServiceById);

router.post("/", createService);

router.put("/settings", updateServiceSettings);

router.put("/:id", updateService);

router.delete("/:id", deleteService);

export default router;
