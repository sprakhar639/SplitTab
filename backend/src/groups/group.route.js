import { Router } from "express";
import { create, addMemberController,removeMemberController } from "./group.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";


const router = Router();

router.post("/", authMiddleware, create);
router.post("/:groupId/members",authMiddleware,addMemberController);
router.delete("/:groupId/members/:userId",authMiddleware,removeMemberController)

export default router;
