import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import {
  userRegister,
  userLogin,
  userLogout,
  currentUserController,
  updateProfileController,
  changePasswordController,
} from "./auth.controller.js";

const router = Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/logout", userLogout);
router.get("/me", authMiddleware, currentUserController);
router.patch("/profile", authMiddleware, updateProfileController);
router.patch("/password", authMiddleware, changePasswordController);

export default router;
