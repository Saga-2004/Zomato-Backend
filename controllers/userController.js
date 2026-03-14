import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendResetEmail, sendWelcomeEmail } from "../config/emailConfig.js";

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate raw token
    const rawToken = crypto.randomBytes(32).toString("hex");
    console.log(rawToken);

    // Hash the token before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send raw token in URL (not hashed)
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

    await sendResetEmail(user.email, resetURL);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the incoming token to match what's in DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Set new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_USER_ID, {
    expiresIn: "30d",
  });
};

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = await req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      availabilityStatus: "online",
    });

    // Send welcome email (non-blocking — won't crash signup if email fails)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.error("Welcome email failed:", err.message),
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      availabilityStatus: user.availabilityStatus,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Set availability status to online when they log in
      user.availabilityStatus = "online";
      await user.save();

      res.json({
        _id: user._id,
        isBlocked: user.isBlocked,
        name: user.name,
        email: user.email,
        role: user.role,
        availabilityStatus: user.availabilityStatus,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    // console.log("Logout called for user:", req.user._id);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { availabilityStatus: "offline" },
      { new: true },
    );

    // console.log("logout update result:", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Logged out successfully",
      availabilityStatus: updatedUser.availabilityStatus,
    });
  } catch (error) {
    console.log("logout error", error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE AVAILABILITY (for delivery partners, but allowed for any logged-in user)
export const updateAvailability = async (req, res) => {
  try {
    const { availabilityStatus } = req.body;

    const allowed = ["online", "offline"];
    if (!allowed.includes(availabilityStatus)) {
      return res.status(400).json({
        message: "Invalid availability status. Use 'online' or 'offline'.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.availabilityStatus = availabilityStatus;
    await user.save();

    res.json({
      message: "Availability updated successfully",
      availabilityStatus: user.availabilityStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROFILE (name/phone/address/saved addresses)
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, savedAddresses } = req.body || {};

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string" && name.trim() !== "") {
      user.name = name.trim();
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    if (typeof address === "string") {
      user.address = address.trim();
    }

    if (savedAddresses && typeof savedAddresses === "object") {
      user.savedAddresses = {
        home:
          typeof savedAddresses.home === "string"
            ? savedAddresses.home.trim()
            : user.savedAddresses?.home,
        work:
          typeof savedAddresses.work === "string"
            ? savedAddresses.work.trim()
            : user.savedAddresses?.work,
      };
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
