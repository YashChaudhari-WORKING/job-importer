const Job = require("../models/Job");
const ImportLog = require("../models/ImportLog");
const env = require("../config/env");

/**
 * Import jobs into MongoDB with upsert logic
 * @param {Array} jobs - Array of normalized job objects from feedFetcher
 * @param {string} feedUrl - The source feed URL (for logging)
 * @returns {Object} Import summary { totalFetched, newJobs, updatedJobs, failedJobs }
 */
const importJobs = async (jobs, feedUrl) => {
  const log = await ImportLog.create({
    fileName: feedUrl,
    status: "processing",
    totalFetched: jobs.length,
  });

  let newJobs = 0;
  let updatedJobs = 0;
  let failedJobs = 0;
  const failures = [];

  const batchSize = env.BATCH_SIZE;

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);

    try {
      const operations = batch.map((job) => ({
        updateOne: {
          filter: { sourceId: job.sourceId },
          update: { $set: job },
          upsert: true,
        },
      }));

      const result = await Job.bulkWrite(operations, { ordered: false });

      newJobs += result.upsertedCount;
      updatedJobs += result.modifiedCount;
    } catch (error) {
      if (error.result) {
        newJobs += error.result.nUpserted || 0;
        updatedJobs += error.result.nModified || 0;
      }

      const writeErrors = error.writeErrors || [];
      for (const writeError of writeErrors) {
        failedJobs++;
        failures.push({
          record: batch[writeError.index]?.title || "Unknown",
          reason: writeError.errmsg || "Unknown error",
        });
      }
    }
  }

  log.status = "completed";
  log.totalImported = newJobs + updatedJobs;
  log.newJobs = newJobs;
  log.updatedJobs = updatedJobs;
  log.failedJobs = failedJobs;
  log.failures = failures;
  await log.save();

  return {
    totalFetched: jobs.length,
    totalImported: newJobs + updatedJobs,
    newJobs,
    updatedJobs,
    failedJobs,
  };
};

module.exports = { importJobs };
