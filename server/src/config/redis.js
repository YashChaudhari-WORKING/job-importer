const env = require("./env");

const getRedisOptions = () => {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    maxRetriesPerRequest: null,
    ...(url.protocol === "rediss:" && {
      tls: { rejectUnauthorized: false },
    }),
  };
};

module.exports = { getRedisOptions };
