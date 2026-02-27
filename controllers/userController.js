import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    console.log("Logout called for user:", req.user._id);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { availabilityStatus: "offline" },
      { new: true },
    );

    console.log("logout update result:", updatedUser);

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
