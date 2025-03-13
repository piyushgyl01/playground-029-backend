const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "socialableUser",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("socialablePost", postSchema);
 