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

    const hashedPassword = await sha1(password);
    let result;
    try {
      result = await dbClient.usersCollection.insertOne({ email, password: hashedPassword });
    } catch (error) {
    // Add a job to the userQueue
      await userQueue.add({});
      return res.status(500).send({ error: 'User creation failed.' });
    }
    const user = { _id: result.insertedId, email };
    await userQueue.add({ userId: result.insertedId.toString() });

    return res.status(201).send(user);
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
