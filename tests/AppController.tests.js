// Tests for AppController
/* eslint-disable */
const chai = require('chai');
const sinon = require('sinon');
const AppController = require('../controllers/AppController');
const dbClient = require('../dbClient');
const redisClient = require('../redisClient');

const { expect } = chai;

describe('appController', () => {
  describe('getStatus', () => {
    it('should return status 200 and the status of redis and db clients', () => {
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
      };
      sinon.stub(redisClient, 'isAlive').returns(true);
      sinon.stub(dbClient, 'isAlive').returns(true);

      AppController.getStatus(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.send.calledWith({ redis: true, db: true })).to.be.true;

      redisClient.isAlive.restore();
      dbClient.isAlive.restore();
    });
  });

  describe('getStats', () => {
    it('should return the number of users and files from the db client', () => {
      const req = {};
      const res = {
        send: sinon.stub(),
      };
      sinon.stub(dbClient, 'nbUsers').returns(10);
      sinon.stub(dbClient, 'nbFiles').returns(20);

      AppController.getStats(req, res);

      expect(res.send.calledWith({ users: 10, files: 20 })).to.be.true;

      dbClient.nbUsers.restore();
      dbClient.nbFiles.restore();
    });
  });
});
