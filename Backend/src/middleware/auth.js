// JWT auth middleware for protected backend routes.
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    // Only allow users whose token role matches the route rules.
    if (!req.user?.role) {
      return res.status(403).json({ error: "Role not present on token." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission for this action." });
    }

    return next();
  };
}
