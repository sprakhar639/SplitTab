import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import {
  userRegister,
  userLogin,
  userLogout,
  currentUserController,
} from "./auth.controller.js";

const router = Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/logout", userLogout);
router.get("/me", authMiddleware, currentUserController);

export default router;
