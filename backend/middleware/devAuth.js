import jwt from "jsonwebtoken";

const DEV_PASSWORD = process.env.DEV_PASSWORD;
const DEV_JWT_SECRET = process.env.JWT_SECRET;

if (!DEV_PASSWORD || !DEV_JWT_SECRET) {
  console.warn(
    "⚠️  DEV_PASSWORD and/or DEV_JWT_SECRET are not set. " +
    "The developer dashboard will be unusable/insecure until these are configured."
  );
}

export const devLogin = (req, res) => {
  const { password } = req.body;

  if (!DEV_PASSWORD || !DEV_JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Developer auth is not configured on the server"
    });
  }

  if (!password || password !== DEV_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Invalid password"
    });
  }

  const token = jwt.sign(
    { role: "developer" },
    DEV_JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    success: true,
    message: "Authenticated",
    token,
    expiresIn: 2 * 60 * 60 // seconds, for the frontend to schedule auto-logout
  });
};

const verifyDeveloper = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Missing developer token"
      });
    }

    if (!DEV_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Developer auth is not configured on the server"
      });
    }

    const decoded = jwt.verify(token, DEV_JWT_SECRET);
    if (decoded.role !== "developer") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.developer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired developer session"
    });
  }
};

export default verifyDeveloper;