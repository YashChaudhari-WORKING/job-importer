const mongoose = require("mongoose");

const importLogSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    importDateTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    totalFetched: {
      type: Number,
      default: 0,
    },
    totalImported: {
      type: Number,
      default: 0,
    },
    newJobs: {
      type: Number,
      default: 0,
    },
    updatedJobs: {
      type: Number,
      default: 0,
    },
    failedJobs: {
      type: Number,
      default: 0,
    },
    failures: [
      {
        record: String,
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImportLog", importLogSchema);
