// Module for endpoints definitions
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  // GET /status
  static getStatus(req, res) {
    res.status(200).send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  // GET /stats
  static async getStats(req, res) {
    res.status(200).send({ users: await dbClient.nbUsers(), files: await dbClient.nbFiles() });
  }
}

module.exports = AppController;
