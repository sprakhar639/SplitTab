import { Router } from "express";
import { createMessageController } from "./message.controller.js";
import authMiddleware from "../../../middleware/auth.middleware.js";

const router = Router();

// First message — conversation ID doesn't exist yet
router.post("/", authMiddleware, createMessageController);

// Subsequent messages — conversation ID already exists
router.post("/:conversationId", authMiddleware, createMessageController);

export default router;
