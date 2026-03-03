const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const userId = req.signedCookies.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated. Please log in." });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found. Please log in again." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed." });
  }
};

module.exports = auth;
