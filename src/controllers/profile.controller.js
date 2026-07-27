import User from "../models/User.js";
import updateProfileSchema from "../validators/profile.validations.js";

/**
 * GET /profile
 * Returns the logged-in user's profile (no password).
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role createdAt updatedAt",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /profile
 * Allows the logged-in user to update only their name.
 */
export const updateProfile = async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { name } = parsed.data;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true },
    ).select("name email role createdAt updatedAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
