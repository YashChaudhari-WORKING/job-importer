const express = require("express");
const router = express.Router();
const {
  getImportLogs,
  getImportLogById,
  triggerImport,
} = require("../controllers/importLogController");
const auth = require("../middleware/auth");

router.get("/logs", auth, getImportLogs);
router.get("/logs/:id", auth, getImportLogById);
router.post("/trigger", auth, triggerImport);

module.exports = router;
