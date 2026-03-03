const FeedSource = require("../models/FeedSource");

// GET /api/feeds
const getFeeds = async (req, res, next) => {
  try {
    const feeds = await FeedSource.find().sort({ createdAt: -1 });
    res.json({ success: true, data: feeds });
  } catch (error) {
    next(error);
  }
};

// POST /api/feeds
const addFeed = async (req, res, next) => {
  try {
    const { url, name } = req.body;

    if (!url || !name) {
      return res.status(400).json({ message: "URL and name are required" });
    }

    const feed = await FeedSource.create({ url, name });
    res.status(201).json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/feeds/:id
const toggleFeed = async (req, res, next) => {
  try {
    const feed = await FeedSource.findById(req.params.id);

    if (!feed) {
      return res.status(404).json({ message: "Feed not found" });
    }

    feed.isActive = !feed.isActive;
    await feed.save();

    res.json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/feeds/:id
const deleteFeed = async (req, res, next) => {
  try {
    const feed = await FeedSource.findByIdAndDelete(req.params.id);

    if (!feed) {
      return res.status(404).json({ message: "Feed not found" });
    }

    res.json({ success: true, message: "Feed deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFeeds, addFeed, toggleFeed, deleteFeed };
