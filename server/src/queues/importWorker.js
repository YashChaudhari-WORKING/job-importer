const { Worker } = require("bullmq");
const { getRedisOptions } = require("../config/redis");
const { fetchFeed } = require("../services/feedFetcher");
const { importJobs } = require("../services/jobImporter");
const FeedSource = require("../models/FeedSource");
const ImportLog = require("../models/ImportLog");
const env = require("../config/env");

let worker = null;

const startWorker = () => {
  worker = new Worker(
    "job-import",
    async (job) => {
      const { feedUrl } = job.data;
      console.log(`Processing feed: ${feedUrl}`);

      const jobs = await fetchFeed(feedUrl);
      console.log(`Fetched ${jobs.length} jobs from ${feedUrl}`);

      if (jobs.length === 0) {
        await ImportLog.create({
          fileName: feedUrl,
          status: "completed",
          totalFetched: 0,
        });
        return { feedUrl, totalFetched: 0 };
      }

      const result = await importJobs(jobs, feedUrl);

      await FeedSource.findOneAndUpdate(
        { url: feedUrl },
        { lastFetchedAt: new Date() }
      );

      console.log(
        `Import complete for ${feedUrl}: ` +
        `${result.newJobs} new, ${result.updatedJobs} updated, ${result.failedJobs} failed`
      );

      return result;
    },
    {
      connection: getRedisOptions(),
      concurrency: env.WORKER_CONCURRENCY,
    }
  );

  worker.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
  });

  worker.on("failed", async (job, error) => {
    console.error(`Job ${job.id} failed:`, error.message);

    try {
      await ImportLog.create({
        fileName: job.data.feedUrl,
        status: "failed",
        failures: [{ record: "Feed fetch", reason: error.message }],
      });
    } catch (logError) {
      console.error("Failed to log import failure:", logError.message);
    }
  });

  worker.on("error", (error) => {
    console.error("Worker error:", error.message);
  });

  console.log(`Worker started with concurrency: ${env.WORKER_CONCURRENCY}`);
  return worker;
};

const stopWorker = async () => {
  if (worker) {
    await worker.close();
    console.log("Worker stopped");
  }
};

module.exports = { startWorker, stopWorker };
