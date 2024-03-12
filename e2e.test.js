require('dotenv').config();
const request = require('supertest');
const app = require('./app.js');
const {TariffSchema} = require('@flat-peak/express-integration-sdk');

const validCredentials = {
  login: process.env.TEST_CUSTOMER_USER,
  password: process.env.TEST_CUSTOMER_PASSWORD,
};

// const invalidCredentials = {
//   login: 'invalid-user@gmail.com',
//   password: 'invalid-pass',
// };

describe('Octopus Energy UK -> E2E', () => {
  describe('API', () => {
    describe('/tariff_plan', () => {
      it('should fetch tariff plan with valid credentials', async () => {
        const result = await request(app).post('/api/tariff_plan')
            .send({auth_metadata: {data: validCredentials}});
        TariffSchema.parse(result.body);
      }, 20000);
    });
  });
});
