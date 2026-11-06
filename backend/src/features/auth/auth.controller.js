import { register, login, logout } from "./auth.service.js";


async function userRegister(req, res, next) {
  try {
    const  sessionToken = await register(req.body);

    res.cookie("sessionId", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ message: "Registed Successfully" });
  } catch (error) {
    next(error);
  }
}

async function userLogin(req, res, next) {
  try {
    const  sessionToken  = await login(req.body);

    res.cookie("sessionId", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "LoggedIn Successfully" });
  } catch (error) {
    next(error);
  }
}

async function userLogout(req, res, next) {
  try {
    const sessionId = req.cookies.sessionId;
    await logout(sessionId);
    res.clearCookie("sessionId");
    return res.status(200).json({ message: "LogOut Successfully" });
  } catch (error) {
    next(error);
  }
}

export { userRegister, userLogin, userLogout };
