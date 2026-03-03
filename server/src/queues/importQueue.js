const { Queue } = require("bullmq");
const { getRedisOptions } = require("../config/redis");

const importQueue = new Queue("job-import", {
  connection: getRedisOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Add a feed URL to the import queue
 * @param {string} feedUrl - The RSS feed URL to process
 */
const addFeedToQueue = async (feedUrl) => {
  await importQueue.add(
    "process-feed",
    { feedUrl },
    {
      jobId: `feed-${Date.now()}-${feedUrl.replace(/[^a-zA-Z0-9]/g, "_")}`,
    }
  );
  console.log(`Queued feed: ${feedUrl}`);
};

module.exports = { importQueue, addFeedToQueue };
