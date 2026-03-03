const ImportLog = require("../models/ImportLog");
const FeedSource = require("../models/FeedSource");
const { addFeedToQueue } = require("../queues/importQueue");

// GET /api/import-logs
const getImportLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ImportLog.find()
        .sort({ importDateTime: -1 })
        .skip(skip)
        .limit(limit),
      ImportLog.countDocuments(),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/import-logs/:id
const getImportLogById = async (req, res, next) => {
  try {
    const log = await ImportLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Import log not found" });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// POST /api/imports/trigger
const triggerImport = async (req, res, next) => {
  try {
    const feeds = await FeedSource.find({ isActive: true });

    if (feeds.length === 0) {
      return res.status(400).json({ message: "No active feeds to import" });
    }

    for (const feed of feeds) {
      await addFeedToQueue(feed.url);
    }

    res.json({
      success: true,
      message: `Queued ${feeds.length} feeds for import`,
      feedsQueued: feeds.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getImportLogs, getImportLogById, triggerImport };
