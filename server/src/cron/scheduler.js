const cron = require("node-cron");
const FeedSource = require("../models/FeedSource");
const { addFeedToQueue } = require("../queues/importQueue");
const env = require("../config/env");

let cronJob = null;

const startCron = () => {
  cronJob = cron.schedule(
    env.CRON_SCHEDULE,
    async () => {
      console.log(`[CRON] Running scheduled import at ${new Date().toISOString()}`);

      try {
        const feeds = await FeedSource.find({ isActive: true });

        if (feeds.length === 0) {
          console.log("[CRON] No active feeds found. Skipping.");
          return;
        }

        for (const feed of feeds) {
          await addFeedToQueue(feed.url);
        }

        console.log(`[CRON] Queued ${feeds.length} feeds for import`);
      } catch (error) {
        console.error("[CRON] Error:", error.message);
      }
    },
    {
      scheduled: false,
    }
  );

  cronJob.start();
  console.log(`Cron scheduler started: ${env.CRON_SCHEDULE}`);
};

const stopCron = () => {
  if (cronJob) {
    cronJob.stop();
    console.log("Cron scheduler stopped");
  }
};

module.exports = { startCron, stopCron };
