require('dotenv').config();
const request = require('supertest');
const app = require('./app.js');
const {FlatpeakService} = require('@flat-peak/javascript-sdk');
const flatpeak = new FlatpeakService(process.env.FLATPEAK_API_URL, process.env.TEST_PUBLISHABLE_KEY);
const encodeState = (data) => Buffer.from(JSON.stringify(data)).toString('base64');
const decodeState = (data) => JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
const extractState = (str) => {
  const regexp = /state: "([a-zA-Z0-9=]+)"/g;
  const matches = regexp.exec(str);
  return decodeState(matches[1]);
};
const extractRedirectParams = (str) => {
  const regexpAuth = /name="auth" value="([a-zA-Z0-9=]+)"/g;
  const regexpState = /name="state" value="([a-zA-Z0-9=]+)"/g;
  const regexpAction = /action="([/a-zA-Z0-9=]+)"/g;
  return {
    action: regexpAction.exec(str)[1],
    auth: regexpAuth.exec(str)[1],
    state: decodeState(regexpState.exec(str)[1]),
  };
};
const TEST_REQUEST_ID = 'TEST_REQUEST_ID';
const validAuthorisation = Buffer.from(process.env.TEST_PUBLISHABLE_KEY + ':').toString('base64');
const invalidAuthorisation = Buffer.from('pk_test_INVALID_KEY:').toString('base64');
const validInputState = encodeState({
  'request_id': TEST_REQUEST_ID,
  'provider_id': process.env.TEST_PROVIDER_ID || process.env.PROVIDER_ID, 
  'postal_address': {
    address_line1: '123',
    address_line2: 'Infinite Drive',
    city: 'London',
    state: 'Greather London',
    post_code: 'SE110AA',
    country_code: 'GB',
  },
});
const invalidInputState = '';
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
      it('should initiate session with invalid authorization', async () => {
        const authResponse = await request(app).post(`/`).send({
          auth: invalidAuthorisation,
          state: validInputState,
        });
        expect(authResponse.statusCode).toBe(400);
        expect(authResponse.text.match('access denied')).not.toBeNull();
      });

      it('should initiate session with invalid state', async () => {
        const authResponse = await request(app).post(`/`).send({
          auth: validAuthorisation,
          state: invalidInputState,
        });
        expect(authResponse.statusCode).toBe(400);
        expect(authResponse.text.match('Missing state')).not.toBeNull();
      });

      it('should initiate session with a valid state and authorization', async () => {
        const authResponse = await request(app).post(`/`).send({
          auth: validAuthorisation,
          state: validInputState,
        });
        expect(authResponse.statusCode).toBe(302);
        const result = extractRedirectParams(authResponse.text);
        expect(result.action).toBe('/auth');
        expect(result.auth).toBe(validAuthorisation);
        expect(result.state.request_id).toBe(TEST_REQUEST_ID);
      });

      it('should display auth form', async () => {
        const formResponse = await request(app).post('/auth').send({
          auth: validAuthorisation,
          state: validInputState,
        });
        expect(formResponse.statusCode).toBe(200);
        expect(formResponse.text.match(/<form name="auth"/)).not.toBeNull();
      });
    });

    describe('Authorisation', () => {
      it('should pass valid credentials', async () => {
        const formResponse = await request(app).post('/auth/capture').send({
          auth: validAuthorisation,
          state: validInputState,
          ...validCredentials,
        });
        const result = extractRedirectParams(formResponse.text);

        expect(formResponse.statusCode).toBe(302);
        expect(result.action).toBe('/share');
        expect(result.state.auth_metadata).toBeDefined();
        expect(JSON.stringify(result.state.auth_metadata)).toBe(JSON.stringify(validCredentials));
      });

      it('should pass invalid credentials', async () => {
        const formResponse = await request(app).post('/auth/capture').send({
          auth: validAuthorisation,
          state: validInputState,
          ...invalidCredentials,
        });
        expect(formResponse.statusCode).toBe(400);
        expect(formResponse.text.match('Error')).not.toBeNull();
      });
    });

    describe('Sharing', () => {
      it('should display share form with valid credentials', async () => {
        const shareResponse = await request(app).post('/share').send({
          auth: validAuthorisation,
          state: encodeState({
            ...decodeState(validInputState),
            auth_metadata: validCredentials,
          }),
        });
        expect(shareResponse.text.match(/<form name="share"/)).not.toBeNull();
        expect(shareResponse.statusCode).toBe(200);
      });

      it('should not display share form with missing credentials', async () => {
        const shareResponse = await request(app).post('/share').send({
          auth: validAuthorisation,
          state: validInputState,
        });
        expect(shareResponse.text.match(/<form name="share"/)).toBeNull();
        const result = extractRedirectParams(shareResponse.text);
        expect(shareResponse.statusCode).toBe(302);
        expect(result.action).toBe('/auth');
      });


      it('should share tariff', async () => {
        const shareResponse = await request(app).post('/share/capture').send({
          auth: validAuthorisation,
          state: encodeState({
            ...decodeState(validInputState),
            auth_metadata: validCredentials,
          }),
        });

        const result = extractState(shareResponse.text);
        expect(Object.keys(result).length).toBeGreaterThan(2);
        expect(result.customer_id).toBeDefined();
        expect(result.tariff_id).toBeDefined();
        expect(result.product_id).toBeDefined();

        const tariff = await flatpeak.tariffs.retrieve(result.tariff_id);

        expect(tariff.object).toBe('tariff');
        expect(tariff.integrated).toBeTruthy();
        expect(tariff.import.length).toBeGreaterThan(0);
        expect(tariff.import[0].data.length).toBeGreaterThan(0);
        // expect(tariff.display_name).toBeTruthy();
      }, 30000);
    });
  });

  describe('API', () => {
    describe('/tariff_plan', () => {
      it('should fetch tariff plan with valid credentials', async () => {
        const result = await request(app).post('/api/tariff_plan')
            .send({auth_metadata: {data: validCredentials}});
        const tariff = result.body;

        expect(tariff.object).toBe('tariff');
        expect(tariff.integrated).toBeTruthy();
        expect(tariff.import.length).toBeGreaterThan(0);
        expect(tariff.import[0].data.length).toBeGreaterThan(0);
        expect(tariff.display_name).toBeTruthy();
      });
    });
  });
});
