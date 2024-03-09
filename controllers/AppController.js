// Module for endpoints definitions
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  // GET /status
  static getStatus(req, res) {
    res.status(200).send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  // GET /stats
  static getStats(req, res) {
    res.send({ users: dbClient.nbUsers(), files: dbClient.nbFiles() });
  }
}

module.exports = AppController;
