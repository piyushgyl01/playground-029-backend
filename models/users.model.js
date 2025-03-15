const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function() {
        // Username is required only if it's not an OAuth user
        return !this.googleId && !this.githubId;
      },
      unique: true,
      sparse: true // This allows null values to exist without violating uniqueness
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true // This allows null values to exist without violating uniqueness
    },
    password: {
      type: String,
      required: function() {
        // Password is required only if it's not an OAuth user
        return !this.googleId && !this.githubId;
      }
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true
    },
    avatar: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("socialableUser", userSchema);