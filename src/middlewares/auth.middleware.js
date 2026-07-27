import jwt from "jsonwebtoken";

export const verifyAdminToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin token required",
      });
    }

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(403).json({
      message: "Invalid admin token",
    });
  }
};

export const verifyAnyToken = (req, res, next) => {
  const token = req.cookies?.token || req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Try admin secret first
  try {
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    req.user = decoded;
    return next();
  } catch {}

  // Try user secret
  try {
    const decoded = jwt.verify(token, process.env.JWT_CUSTOMER_SECRET);
    req.user = decoded;
    // console.log(req.user);
    return next();
  } catch {}

  return res.status(401).json({ message: "Invalid or expired token" });
};
