import { register, login, logout } from "./auth.service.js";

async function userRegister(req, res) {
  try {
    const { sessionToken } = await register(req.body);

    res.cookie("sessionId", sessionToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Registed Successfully"});
  } catch (error) {
    res.status(404).json({ message: "Registration Failed" });
  }
}

async function userLogin(req, res) {
  try {
    const {sessionToken} = await login(req.body);

    res.cookie("sessionId",sessionToken,{
      httpOnly:true,
      secure:false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.status(200).json({ message: "LoggedIn Successfully"});
  } catch (error) {
    res.status(404).json({ message: "Login Failed" });
  }
}

async function userLogout(req,res) {
  try{
    const sessionId=req.cookies.sessionId;
    await logout(sessionId);
    res.clearCookie("sessionId");
    return res.status(200).json({message:"LogOut Successfully"})
    
  }catch(error){
    console.error("LOGOUT ERROR:", error);
    return res.status(401).json({message:error.message})
  }
}

export { userRegister, userLogin, userLogout };
