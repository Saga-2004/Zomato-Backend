export const getAdminDashboard = (req, res) => {
  res.json({
    message: "Welcome Admin",
    admin: req.user,
  });
};
