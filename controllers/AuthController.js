// Authentication controller
const uuid = require('uuid').v4;
const dbClient = require('../utils/db');

class AuthController {
  // GET /connect
  static getConnect(req, res) {
    const Authorization = req.header('Authorization');
    if (!Authorization) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const base64Credentials = Authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const user = dbClient.usersCollection.findOne({ email, password });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const token = uuid();
    dbClient.usersCollection.update({ email, password }, { $set: { token } });
    return res.status(200).send({ token });
  }

  // GET /disconnect
  static getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const user = dbClient.usersCollection.findOne({ token });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    dbClient.usersCollection.update({ token }, { $set: { token: '' } });
    return res.status(204).send();
  }
}

module.exports = AuthController;
