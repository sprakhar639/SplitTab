import { Router } from "express";
import { createMessageController,getMessageController } from "./message.controller.js";
import authMiddleware from "../../../middleware/auth.middleware.js";

const router = Router();

// First message — conversation ID doesn't exist yet
router.post("/", authMiddleware, createMessageController);

// Subsequent messages — conversation ID already exists
router.post("/:conversationId", authMiddleware, createMessageController);

router.get("/:conversationId",authMiddleware,getMessageController)

export default router;
