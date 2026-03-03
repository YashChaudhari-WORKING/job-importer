const express = require("express");
const router = express.Router();
const { getJobs } = require("../controllers/jobController");
const auth = require("../middleware/auth");

router.get("/", auth, getJobs);

module.exports = router;
