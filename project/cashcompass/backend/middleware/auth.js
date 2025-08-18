const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    const raw = req.header("Authorization") || "";
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
