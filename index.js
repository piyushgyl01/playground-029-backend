const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const passport = require("passport");

const { initialiseDatabase } = require("./db/db.connect.js");
const User = require("./models/users.model.js");
const Post = require("./models/post.model.js");

const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

require("./config/passport")(passport);
app.use(passport.initialize());

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://playground-029-frontend.vercel.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;

initialiseDatabase();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("Access denied. Provied the token");
    return res
      .status(401)
      .json({ message: "Access denied. Provied the token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token provided" });
  }
};

app.post("/auth/register", async (req, res) => {
  const { username, name, password } = req.body;
  console.log(username, name, password);

  if (!username || !name || !password) {
    return res.status(400).json({ message: "Please provide all details" });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists. Please choose a different username.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      name,
      password: hashedPassword,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please provide all details" });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const userResponse = {
      _id: user._id,
      username: user.username,
      name: user.name,
    };

    return res
      .status(200)
      .json({ message: "Logged in successfully", token, user: userResponse });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error logging in", error: error.message });
  }
});

app.get("/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
});

app.post("/auth/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

app.post("/posts", verifyToken, async (req, res) => {
  const { title, image, content } = req.body;
  const userId = req.user.id;

  try {
    const newPost = new Post({
      title,
      image,
      content,
      author: userId,
    });

    const savedPost = await newPost.save();

    res
      .status(201)
      .json({ message: "Post uploaded successfully", post: savedPost });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading post", error: error.message });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "username name");
    res.json({ posts });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
});

app.put("/posts/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Unable to find the post" });
    }

    if (post.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorised to update the post" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading post", error: error.message });
  }
});

app.delete("/posts/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Unable to find the post" });
    }

    if (post.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorised to delete the post" });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: "Post deleted successfully", post: post });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting the post", error: error.message });
  }
});

app.use("/auth", authRoutes);


app.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
});
