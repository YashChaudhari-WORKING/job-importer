const express = require("express");
const router = express.Router();
const { getFeeds, addFeed, toggleFeed, deleteFeed } = require("../controllers/feedController");
const auth = require("../middleware/auth");

router.get("/", auth, getFeeds);
router.post("/", auth, addFeed);
router.patch("/:id", auth, toggleFeed);
router.delete("/:id", auth, deleteFeed);

module.exports = router;
