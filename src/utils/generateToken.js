import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const SECRETS = {
  customer: process.env.JWT_CUSTOMER_SECRET,
  admin: process.env.JWT_ADMIN_SECRET,
};

const EXPIRY = {
  customer: "7d",
  admin: "2h",
};

export const generateToken = (user) => {
  const secrets = {
    customer: process.env.JWT_CUSTOMER_SECRET,
    admin: process.env.JWT_ADMIN_SECRET,
  };

  const role = user.role?.toLowerCase();

  if (!secrets[role]) {
    throw new Error(`Missing JWT secret for role: ${role}`);
  }

  return jwt.sign({ id: user._id, role }, secrets[role], {
    expiresIn: role === "admin" ? "2h" : "7d",
  });
};
