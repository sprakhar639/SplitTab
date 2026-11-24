import {
  register,
  login,
  logout,
  getCurrentUser,
} from "./auth.service.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

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

export {
  userRegister,
  userLogin,
  userLogout,
  currentUserController,
};