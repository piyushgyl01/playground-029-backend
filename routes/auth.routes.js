// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/users.model");

// Generate JWT token
const generateToken = (user, provider) => {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username || user.email,
      provider: provider // Include provider in the token
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth" }),
  (req, res) => {
    const token = generateToken(req.user, "google");
    
    // Add provider to user object before sending to frontend
    const userWithProvider = {
      ...req.user.toObject(),
      provider: "google"
    };
    
    // Redirect to frontend with token and provider info
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-callback?token=${token}&user=${encodeURIComponent(
        JSON.stringify(userWithProvider)
      )}&provider=google`
    );
  }
);

// GitHub OAuth routes
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/auth" }),
  (req, res) => {
    const token = generateToken(req.user, "github");
    
    // Add provider to user object before sending to frontend
    const userWithProvider = {
      ...req.user.toObject(),
      provider: "github"
    };
    
    // Redirect to frontend with token and provider info
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-callback?token=${token}&user=${encodeURIComponent(
        JSON.stringify(userWithProvider)
      )}&provider=github`
    );
  }
);

module.exports = router;