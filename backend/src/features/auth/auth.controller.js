import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgetPassword,
  resetPassword,
} from "./auth.service.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

// REGISTER
async function userRegister(req, res, next) {
  try {
    const sessionToken = await register(req.body);

    res.cookie("sessionId", sessionToken, cookieOptions);

    return res.status(201).json({
      message: "Registered Successfully",
    });
  } catch (error) {
    next(error);
  }
}

// LOGIN
async function userLogin(req, res, next) {
  try {
    const sessionToken = await login(req.body);

    res.cookie("sessionId", sessionToken, cookieOptions);

    return res.status(200).json({
      message: "Logged In Successfully",
    });
  } catch (error) {
    next(error);
  }
}

// LOGOUT
async function userLogout(req, res, next) {
  try {
    const sessionId = req.cookies.sessionId;
    await logout(sessionId);
    res.clearCookie("sessionId", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
    return res.status(200).json({
      message: "Logged Out Successfully",
    });
  } catch (error) {
    next(error);
  }
}

// GET CURRENT USER
async function currentUserController(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await getCurrentUser(userId);

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

// UPDATE PROFILE
async function updateProfileController(req, res, next) {
  try {
    const userId = Number(req.user.id);
    const { name, username, email } = req.body;

    const result = await updateProfile(userId, {
      name,
      username,
      email,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: result,
    });
  } catch (error) {
    next(error);
  }
}

// CHANGE PASSWORD
async function changePasswordController(req, res, next) {
  try {
    const userId = Number(req.user.id);
    const { currentPassword, newPassword } = req.body;

    await changePassword(userId, {
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
}

// FORGOT PASSWORD
async function forgetPasswordController(req, res, next) {
  try {
    const { email } = req.body;

    await forgetPassword(email);

    return res.status(200).json({
      message:
        "If an account exists for this email, a password reset link will be sent.",
    });
  } catch (error) {
    next(error);
  }
}

// RESET PASSWORD
async function resetPasswordController(req, res, next) {
  try {
    const { password, token } = req.body;

    await resetPassword(password, token);

    return res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export {
  userRegister,
  userLogin,
  userLogout,
  currentUserController,
  updateProfileController,
  changePasswordController,
  forgetPasswordController,
  resetPasswordController,
};
