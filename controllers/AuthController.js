// Authentication controller
const sha1 = require('sha1');
const uuid = require('uuid').v4;
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const userUtils = require('../utils/user');

class AuthController {
  // GET /connect
  static async getConnect(req, res) {
    const Authorization = req.header('Authorization') || '';
    const base64Credentials = Authorization.split(' ')[1];
    if (!base64Credentials) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const hashedPassword = sha1(password);
    const user = await dbClient.usersCollection.findOne({ email, password: hashedPassword });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const token = uuid();
    const key = `auth_${token}`;
    const validFor = 24;
    await redisClient.set(key, user._id.toString(), validFor * 3600);
    return res.status(200).send({ token });
  }

  // GET /disconnect
  static async getDisconnect(req, res) {
    const { userId, key } = await userUtils.getUserIdAndKey(req);
    if (!userId || !key) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    await redisClient.del(key);

    return res.status(204).send();
  }
}

module.exports = AuthController;
