require('dotenv').config();
const request = require('supertest');
const app = require('./app.js');
const {FlatpeakService} = require('@flat-peak/javascript-sdk');

const extractParams = (str) => {
  const regexp = /([a-z_])+: "([a-z_\d])+"/g;
  const result = {};
  let match;
  while ((match = regexp.exec(str)) !== null) {
    const p = match[0].split(': ');
    result[p[0]] = p[1].substring(1, p[1].length - 1);
  }
  return result;
};
const service = new FlatpeakService(process.env.FLATPEAK_API_URL, process.env.TEST_PUBLISHABLE_KEY);

const validCredentials = {
  email: process.env.TEST_CUSTOMER_USER,
  password: process.env.TEST_CUSTOMER_PASSWORD,
};

const invalidCredentials = {
  email: 'invalid-user@gmail.com',
  password: 'invalid-pass',
};

describe('Octopus Energy UK -> E2E', () => {
  describe('Onboard', () => {
    describe('Initialisation', () => {
      it('should return home page with a redirect form', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.text.match(/<form name="redirect"/)).not.toBeNull();
      });

      it('should pass initial params with custom headers', async () => {
        const authResponse = await request(app).get('/').set({
          'publishable-key': process.env.TEST_PUBLISHABLE_KEY,
          'product-id': null,
          'customer-id': null,
          'callback-url': null,
        });
        expect(authResponse.statusCode).toBe(302);
        expect(authResponse.headers.location).toBe('/auth');
        expect(authResponse.headers['set-cookie'][0].startsWith('connect.sid=')).toBe(true);
      });

      it('should pass initial params with post data', async () => {
        const authResponse = await request(app).post('/').send({
          'publishable_key': process.env.TEST_PUBLISHABLE_KEY,
          'product_id': null,
          'customer_id': null,
          'callback_url': null,
        });
        expect(authResponse.statusCode).toBe(302);
        expect(authResponse.headers.location).toBe('/auth');
        expect(authResponse.headers['set-cookie'][0].startsWith('connect.sid=')).toBe(true);
      });


      it('should display auth form', async () => {
        const authResponse = await request(app).get('/').set({
          'publishable-key': process.env.TEST_PUBLISHABLE_KEY,
        });
        const formResponse = await request(app).get('/auth').set({
          'Cookie': authResponse.headers['set-cookie'][0],
        });
        expect(formResponse.statusCode).toBe(200);
        expect(formResponse.text.match(/<form name="redirect"/)).toBeNull();
        expect(formResponse.text.match(/<form name="auth"/)).not.toBeNull();
      });
    });

    describe('Authorisation', () => {
      it('should pass valid credentials', async () => {
        const authResponse = await request(app).get('/').set({
          'publishable-key': process.env.TEST_PUBLISHABLE_KEY,
        });
        const formResponse = await request(app).post('/auth').set({
          'Cookie': authResponse.headers['set-cookie'][0],
        }).send(validCredentials);
        expect(formResponse.statusCode).toBe(302);
        expect(formResponse.headers.location).not.toBe('/auth');
        expect(formResponse.headers.location).toBe('/share');
      });

      it('should not pass invalid credentials', async () => {
        const authResponse = await request(app).get('/').set({
          'publishable-key': process.env.TEST_PUBLISHABLE_KEY,
        });
        const formResponse = await request(app).post('/auth').set({
          'Cookie': authResponse.headers['set-cookie'][0],
        }).send(invalidCredentials);
        expect(formResponse.statusCode).toBe(302);
        expect(formResponse.headers.location).toBe('/auth');
        expect(formResponse.headers.location).not.toBe('/share');
      });
    });

    describe('Sharing', () => {
      it('should display share form', async () => {
        const authResponse = await request(app).get('/').set({
          'publishable-key': process.env.TEST_PUBLISHABLE_KEY,
        });
        await request(app).post('/auth').set({
          'Cookie': authResponse.headers['set-cookie'][0],
        }).send(validCredentials);

        const shareResponse = await request(app).get('/share').set({
          'Cookie': authResponse.headers['set-cookie'][0],
        });

        expect(shareResponse.statusCode).toBe(200);
        expect(shareResponse.text.match(/<form name="share"/)).not.toBeNull();
      });
      it('should share tariff', async () => {
        const authResponse = await request(app).get('/').set({
          'publishable-key': process.env.TEST_PUBLISHABLE_KEY,
        });
        await request(app).post('/auth').set({
          'Cookie': authResponse.headers['set-cookie'][0],
        }).send(validCredentials);

        const shareResponse = await request(app).post('/share').set({
          'Cookie': authResponse.headers['set-cookie'][0],
        });

        expect(shareResponse.statusCode).toBe(200);
        expect(shareResponse.text.match(/<form name="share"/)).toBeNull();

        const result = extractParams(shareResponse.text);
        expect(Object.keys(result).length).toBeGreaterThan(2);
        expect(result.customer_id).toBeDefined();
        expect(result.tariff_id).toBeDefined();
        expect(result.product_id).toBeDefined();

        const tariff = await service.getTariff(result.tariff_id);

        expect(tariff.object).toBe('tariff');
        // expect(tariff.is_connected).toBeTruthy();
        expect(tariff.import.length).toBeGreaterThan(0);
        expect(tariff.import[0].data.length).toBeGreaterThan(0);
        expect(tariff.display_name).toBeTruthy();
      }, 10000);
    });
  });

  describe('API', () => {
    describe('/tariff_plan', () => {
      it('should fetch tariff plan with valid credentials', async () => {
        const result = await request(app).post('/api/tariff_plan')
            .send({auth_metadata: {data: validCredentials}});
        const tariff = result.body;

        expect(tariff.object).toBe('tariff');
        expect(tariff.is_connected).toBeTruthy();
        expect(tariff.import.length).toBeGreaterThan(0);
        expect(tariff.import[0].data.length).toBeGreaterThan(0);
        expect(tariff.display_name).toBeTruthy();
      });
    });
  });
});
