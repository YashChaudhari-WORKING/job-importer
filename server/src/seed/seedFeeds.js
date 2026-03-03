require("dotenv").config();
const mongoose = require("mongoose");
const FeedSource = require("../models/FeedSource");
const User = require("../models/User");
const env = require("../config/env");

const feeds = [
  {
    url: "https://jobicy.com/?feed=job_feed",
    name: "Jobicy - All Jobs",
  },
  {
    url: "https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time",
    name: "Jobicy - Social Media (Full-time)",
  },
  {
    url: "https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france",
    name: "Jobicy - Seller (France, Full-time)",
  },
  {
    url: "https://jobicy.com/?feed=job_feed&job_categories=design-multimedia",
    name: "Jobicy - Design & Multimedia",
  },
  {
    url: "https://jobicy.com/?feed=job_feed&job_categories=data-science",
    name: "Jobicy - Data Science",
  },
  {
    url: "https://jobicy.com/?feed=job_feed&job_categories=copywriting",
    name: "Jobicy - Copywriting",
  },
  {
    url: "https://jobicy.com/?feed=job_feed&job_categories=business",
    name: "Jobicy - Business",
  },
  {
    url: "https://jobicy.com/?feed=job_feed&job_categories=management",
    name: "Jobicy - Management",
  },
  {
    url: "https://www.higheredjobs.com/rss/articleFeed.cfm",
    name: "HigherEdJobs - Articles",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding");

    const feedOps = feeds.map((feed) => ({
      updateOne: {
        filter: { url: feed.url },
        update: { $setOnInsert: feed },
        upsert: true,
      },
    }));
    const feedResult = await FeedSource.bulkWrite(feedOps);
    console.log(`Feeds: ${feedResult.upsertedCount} new, ${feedResult.modifiedCount} existing`);

    const existingAdmin = await User.findOne({ email: "admin@admin.com" });
    if (!existingAdmin) {
      await User.create({
        name: "Admin",
        email: "admin@admin.com",
        password: "admin123",
      });
      console.log("Default admin created: admin@admin.com / admin123");
    } else {
      console.log("Admin user already exists");
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error.message);
    process.exit(1);
  }
};

seed();
