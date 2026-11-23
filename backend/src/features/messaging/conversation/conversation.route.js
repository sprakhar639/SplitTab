import express from "express";
import { createConversationController } from "./conversation.controller.js";
import authMiddleware from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createConversationController);

export default router;
