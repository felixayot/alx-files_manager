// Tests for UsersController
/* eslint-disable */
const UsersController = require('../controllers/UsersController');
const dbClient = require('../dbClient');
const sha1 = require('../sha1');
const userQueue = require('../userQueue');

jest.mock('../dbClient');
jest.mock('../sha1');
jest.mock('../userQueue');

describe('usersController', () => {
  describe('postNew', () => {
    it('should create a new user and return the user object', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const hashedPassword = 'hashedPassword123';
      const insertedId = '1234567890';

      dbClient.usersCollection.findOne.mockResolvedValue(null);
      sha1.mockResolvedValue(hashedPassword);
      dbClient.usersCollection.insertOne.mockResolvedValue({ insertedId });

      await UsersController.postNew(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        id: insertedId,
        email: req.body.email,
      });
      expect(dbClient.usersCollection.findOne).toHaveBeenCalledWith({
        email: req.body.email,
      });
      expect(sha1).toHaveBeenCalledWith(req.body.password);
      expect(dbClient.usersCollection.insertOne).toHaveBeenCalledWith({
        email: req.body.email,
        password: hashedPassword,
      });
      expect(userQueue.add).toHaveBeenCalledWith({ userId: insertedId });
    });

    it('should return an error if email is missing', async () => {
      const req = {
        body: {
          password: 'password123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await UsersController.postNew(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Missing email' });
    });

    it('should return an error if password is missing', async () => {
      const req = {
        body: {
          email: 'test@example.com',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await UsersController.postNew(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Missing password' });
    });

    it('should return an error if user with the same email already exists', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      dbClient.usersCollection.findOne.mockResolvedValue({
        email: req.body.email,
      });

      await UsersController.postNew(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: 'Already exist' });
      expect(dbClient.usersCollection.findOne).toHaveBeenCalledWith({
        email: req.body.email,
      });
    });
  });

  describe('getMe', () => {
    it('should return the user object if the token is valid', async () => {
      const req = {
        header: jest.fn().mockReturnValue('validToken'),
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const user = {
        _id: '1234567890',
        email: 'test@example.com',
      };

      dbClient.usersCollection.findOne.mockResolvedValue(user);

      await UsersController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        id: user._id,
        email: user.email,
      });
      expect(dbClient.usersCollection.findOne).toHaveBeenCalledWith({
        token: 'validToken',
      });
    });

    it('should return an error if the token is missing', async () => {
      const req = {
        header: jest.fn(),
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await UsersController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return an error if the user with the token does not exist', async () => {
      const req = {
        header: jest.fn().mockReturnValue('invalidToken'),
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      dbClient.usersCollection.findOne.mockResolvedValue(null);

      await UsersController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(dbClient.usersCollection.findOne).toHaveBeenCalledWith({
        token: 'invalidToken',
      });
    });
  });
});
