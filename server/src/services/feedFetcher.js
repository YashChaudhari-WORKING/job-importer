const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const crypto = require("crypto");

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  isArray: (name) => name === "item",
});

/**
 * Fetch and parse a feed URL
 * @param {string} feedUrl - The RSS/XML feed URL
 * @returns {Array} Array of normalized job objects
 */
const fetchFeed = async (feedUrl) => {
  const response = await axios.get(feedUrl, {
    timeout: 30000,
    headers: {
      "User-Agent": "JobImporter/1.0",
    },
  });

  const xmlData = response.data;
  const parsed = parser.parse(xmlData);

  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error(`Invalid RSS format from ${feedUrl}`);
  }

  const items = channel.item || [];
  const jobs = items.map((item) => normalizeJob(item, feedUrl));

  return jobs;
};

/**
 * Normalize a single RSS item into our Job schema format
 * @param {Object} item - Raw RSS item
 * @param {string} feedUrl - Source feed URL
 * @returns {Object} Normalized job object
 */
const normalizeJob = (item, feedUrl) => {
  const rawId = item.guid?.["#text"] || item.guid || item.link || item.title;
  const sourceId = crypto.createHash("md5").update(String(rawId)).digest("hex");

  return {
    sourceId,
    title: item.title || "Untitled",
    company:
      item["job_listing:company"] ||
      item.company_name ||
      item["dc:creator"] ||
      item.author ||
      "",
    location:
      item["job_listing:location"] ||
      item.job_location ||
      item.location ||
      "",
    jobType:
      item["job_listing:job_type"] ||
      item.job_type ||
      item.job_listing_type ||
      "",
    category: extractCategory(item),
    description: item.description || item["content:encoded"] || "",
    url: item.link || "",
    pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    sourceFeed: feedUrl,
  };
};

/**
 * Extract category from various possible fields
 * @param {Object} item - RSS item
 * @returns {string} Category string
 */
const extractCategory = (item) => {
  if (item.category) {
    return Array.isArray(item.category) ? item.category.join(", ") : item.category;
  }
  return "";
};

module.exports = { fetchFeed };
