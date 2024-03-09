// Tests for RedisClient class
/* eslint-disable */
const chai = require('chai');
const { promisify } = require('util');
const RedisClient = require('../utils/redis');

const { expect } = chai;

describe('redisClient', () => {
  let redisClient;

  before(() => {
    redisClient = new RedisClient();
  });

  afterEach(async () => {
    await redisClient.del('testKey');
  });

  it('should connect to Redis', () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should set and get a value from Redis', async () => {
    const key = 'testKey';
    const value = 'testValue';
    const time = 60;

    await redisClient.set(key, value, time);
    const result = await redisClient.get(key);

    expect(result).to.equal(value);
  });

  it('should delete a key from Redis', async () => {
    const key = 'testKey';
    const value = 'testValue';
    const time = 60;

    await redisClient.set(key, value, time);
    await redisClient.del(key);
    const result = await redisClient.get(key);

    expect(result).to.be.null;
  });
});
