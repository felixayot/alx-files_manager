// Module for user management

const redisClient = require('./redis');
// const dbClient = require('./db');

class UserUtils {
  static async getUserIdAndKey(request) {
    const obj = { userId: null, key: null };
    const token = request.header('X-Token');
    if (!token) return obj;
    obj.key = `auth_${token}`;
    obj.userId = await redisClient.get(obj.key);
    return obj;
  }

/*
  static async getUser(query) {
    const user = await dbClient.usersCollection.findOne(query);
    return user;
  }
  */
}

const userUtils = new UserUtils();
module.exports = userUtils;
