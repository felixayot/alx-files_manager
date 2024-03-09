// Tests for FilesController
/* eslint-disable */
const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
chai.use(chaiHttp);

const app = require('../app');

describe('filesController', () => {
  describe('pOST /files', () => {
    it('should return 401 Unauthorized if X-Token header is missing', async () => {
      const res = await chai.request(app).post('/files').send({
        name: 'test-file',
        type: 'file',
        data: 'file-data',
      });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 400 Bad Request if name is missing', async () => {
      const res = await chai
        .request(app)
        .post('/files')
        .set('X-Token', 'valid-token')
        .send({
          type: 'file',
          data: 'file-data',
        });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error', 'Missing name');
    });

    // Add more test cases for other scenarios
  });

  describe('gET /files/:id', () => {
    it('should return 401 Unauthorized if X-Token header is missing', async () => {
      const res = await chai.request(app).get('/files/123').send();

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 404 Not Found if file is not found', async () => {
      const res = await chai
        .request(app)
        .get('/files/123')
        .set('X-Token', 'valid-token')
        .send();

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('error', 'File not found');
    });

    // Add more test cases for other scenarios
  });
  
  // Add more test cases for other endpoints
});
