const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const {convert} = require('./tariff-processors');
const {logger} = require('../logger/cloudwatch');
const API_URL = 'https://api.octopus.energy/v1/graphql/';

const getPropertiesQuery = fs.readFileSync(path.resolve(__dirname, 'graphql/getProperties.graphql')).toString();
const krakenTokenAuthenticationQuery = fs.readFileSync(
    path.resolve(__dirname, 'graphql/krakenTokenAuthentication.graphql'),
).toString();
const viewerQuery = fs.readFileSync(path.resolve(__dirname, 'graphql/viewer.graphql')).toString();

const isNotEmptyArray = (object) => Array.isArray(object) && object.length;

const authorise = async ({login: email, password}) => {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: krakenTokenAuthenticationQuery,
      variables: {email, password},
      operationName: 'krakenTokenAuthentication',
    }),
  });

  const body = await resp.json();

  const tokenResponse = body?.data?.obtainKrakenToken;
  if (tokenResponse) {
    return {
      success: true,
      token: tokenResponse?.token,
      error: null,
    };
  } else {
    const message = body?.errors[0]?.message;
    logger.error(`Failed to obtain kraken token ${email} : ${password} from ${API_URL}, response: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
};

const getAccountId = async ({token}) => {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({
      query: viewerQuery,
      operationName: 'viewer',
    }),
  });

  const body = await resp.json();

  const accountsResponse = body?.data?.viewer?.accounts;
  if (accountsResponse) {
    return {
      accountId: accountsResponse[0]?.number,
    };
  } else {
    return {
      error: body?.errors[0]?.message,
    };
  }
};

const capture = async ({token, referenceId}) => {
  let accountNumber = referenceId;
  if (!accountNumber) {
    const {accountId, error} = await getAccountId({token});

    if (error) {
      return {error};
    }

    accountNumber = accountId;
  }

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({
      query: getPropertiesQuery,
      variables: {accountNumber: accountNumber},
      operationName: 'getProperties',
    }),
  });

  const body = await resp.json();

  const accountResponse = body?.data?.account;

  if (accountResponse) {
    const property = isNotEmptyArray(accountResponse.properties) && accountResponse.properties[0];
    if (!property) {
      return {
        error: 'Property not found',
      };
    }
    const electricityMeterPoints = isNotEmptyArray(property.electricityMeterPoints) &&
        property.electricityMeterPoints[0];
    if (!electricityMeterPoints) {
      return {
        error: 'Meter points not found',
      };
    }

    const agreement = isNotEmptyArray(electricityMeterPoints?.agreements) && electricityMeterPoints?.agreements[0];
    if (!agreement) {
      return {
        error: 'Agreement not found',
      };
    }
    return {
      tariff: {
        agreement,
        tariff_code: electricityMeterPoints?.smartTariffOnboarding?.smartTariffCode,
        reference_id: accountNumber,
      },
    };
  } else {
    const errors = body?.errors;
    return {
      error: isNotEmptyArray(errors) ? errors[0].message : 'Unknown error',
    };
  }
};

module.exports = {
  capture, authorise, convert,
};
