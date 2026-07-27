import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { signupSchema, loginSchema } from "../validators/auth.validations.js";
import { error } from "node:console";
const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

// SIGNUP
export const signup = async (req, res) => {
  try {
    // Validate request body
    const validatedData = signupSchema.parse(req.body);

    const { name, email, password } = validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please login to continue.",
    });
  } catch (error) {
    // Zod validation errors
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((issue) => ({
          field: issue.path[0],
          message: issue.message,
        })),
      });
    }

    console.error("Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: { message: "Your account has been blocked." },
      });
    }
    const token = generateToken(user);

    // ✅ Set as httpOnly cookie (Next.js middleware reads this)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge:
        user.role === "admin"
          ? 2 * 60 * 60 * 1000 // 2 hours for admin
          : 7 * 24 * 60 * 60 * 1000, // 7 days for user
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token, // ✅ Keep this too for client-side API calls (Authorization header)
      user: formatUser(user),
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Use the same value as when setting the cookie
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getme = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
