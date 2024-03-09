// Redis client
/* eslint-disable */
const promisify = require('util').promisify;

class RedisClient {
  constructor() {
    this.client = require("redis").createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.client.on("error", (err) => {
      console.log(err);
    });

    this.client.on("connect", () => {
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  async set(key, value, time) {
    this.client.setex(key, time, value);
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
