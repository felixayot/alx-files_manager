// New user controller
const sha1 = require('sha1');
const Queue = require('bull');
const dbClient = require('../utils/db');

const userQueue = new Queue('userQueue');

class UsersController {
  // POST /users
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    if (await dbClient.usersCollection.findOne({ email })) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const user = await UsersController.postNew({ email, password });
    const hashedPassword = await sha1(password);
    const result = await dbClient.usersCollection.insertOne({ email, password: hashedPassword });
    user._id = result.insertedId;

    // Add a job to the userQueue
    await userQueue.add({ userId: user._id });

    return res.status(201).send({ id: user._id, email: user.email });
  }

  // GET users/me
  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const user = await dbClient.usersCollection.findOne({ token });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    return res.status(200).send({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
