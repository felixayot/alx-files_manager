// Tests for AuthController
/* eslint-disable */
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

const AuthController = require('../controllers/AuthController');

describe('authController', () => {
  describe('getConnect', () => {
    it('should return 401 Unauthorized if Authorization header is missing', async () => {
      const res = await chai.request(AuthController).get('/connect');
      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('should return 401 Unauthorized if email or password is missing', async () => {
      const res = await chai
        .request(AuthController)
        .get('/connect')
        .set('Authorization', 'Basic dXNlcjpwYXNzd29yZA=='); // Replace with valid base64 encoded credentials
      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    // Add more test cases for different scenarios
  });

  describe('getDisconnect', () => {
    it('should return 401 Unauthorized if X-Token header is missing', async () => {
      const res = await chai.request(AuthController).get('/disconnect');
      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    // Add more test cases for different scenarios
  });
});
