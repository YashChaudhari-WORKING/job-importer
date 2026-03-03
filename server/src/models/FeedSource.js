const mongoose = require("mongoose");

const feedSourceSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Feed URL is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Feed name is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastFetchedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeedSource", feedSourceSchema);
