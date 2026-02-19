export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient role",
      });
    }

    next();
  };
};

//here roles is an array. eg: ["admin"].includes("admin") or ["restaurant", "admin"].includes("restaurant")
