// config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/users.model");

module.exports = function(passport) {
  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists in the database
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            return done(null, user);
          }
          
          // Check if the email is already registered
          if (profile.emails && profile.emails.length > 0) {
            const existingUser = await User.findOne({ email: profile.emails[0].value });
            if (existingUser) {
              // Update existing user with Google ID
              existingUser.googleId = profile.id;
              if (profile.photos && profile.photos.length > 0) {
                existingUser.avatar = profile.photos[0].value;
              }
              await existingUser.save();
              return done(null, existingUser);
            }
          }
          
          // Create new user
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '',
            username: profile.emails && profile.emails.length > 0 ? profile.emails[0].value.split('@')[0] : `user_${profile.id}`,
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
          });
          
          await user.save();
          return done(null, user);
        } catch (err) {
          console.error("Error in Google authentication:", err);
          return done(err, null);
        }
      }
    )
  );
  
  // GitHub Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback",
        scope: ["user:email"],
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists in the database
          let user = await User.findOne({ githubId: profile.id });
          
          if (user) {
            return done(null, user);
          }
          
          // Check if the email is already registered
          if (profile.emails && profile.emails.length > 0) {
            const existingUser = await User.findOne({ email: profile.emails[0].value });
            if (existingUser) {
              // Update existing user with GitHub ID
              existingUser.githubId = profile.id;
              if (profile.photos && profile.photos.length > 0) {
                existingUser.avatar = profile.photos[0].value;
              }
              await existingUser.save();
              return done(null, existingUser);
            }
          }
          
          // Create new user
          user = new User({
            githubId: profile.id,
            name: profile.displayName || profile.username,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '',
            username: profile.username || (profile.emails && profile.emails.length > 0 ? profile.emails[0].value.split('@')[0] : `user_${profile.id}`),
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
          });
          
          await user.save();
          return done(null, user);
        } catch (err) {
          console.error("Error in GitHub authentication:", err);
          return done(err, null);
        }
      }
    )
  );
  
  // Serialize and deserialize user (required for sessions)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};