import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware.js";

import {
  userRegister,
  userLogin,
  userLogout,
  currentUserController,
  updateProfileController,
  changePasswordController,
  forgetPasswordController,
  resetPasswordController,
} from "./auth.controller.js";

const router = Router();

// Authentication
router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/logout", userLogout);

// User profile
router.get("/me", authMiddleware, currentUserController);
router.patch("/profile", authMiddleware, updateProfileController);

// Password management
router.patch("/password", authMiddleware, changePasswordController);
router.post("/forgot-password", forgetPasswordController);
router.post("/reset-password", resetPasswordController);

export default router;
