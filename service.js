const axios = require("axios");
const API_URL = "https://api.octopus.energy/v1/graphql/";

//TODO: Implement Octopus to Flatpeak convertor
const convertToTariffPlan = (origTariffPlan) => {
  const mockResponse = require("./temp-mocks/tariff-plan.json");
  return {
    ...mockResponse,
    __orig: origTariffPlan, // TODO: remove
  };
};

const obtainKrakenToken = async ({ email, password }) => {
  const result = await axios.post(
    API_URL,
    {
      query: `
          mutation krakenTokenAuthentication($email: String!, $password: String!) {
            obtainKrakenToken(input: {email: $email, password: $password}) {
                token
            }
          }`,
      variables: { email, password },
      operationName: "krakenTokenAuthentication",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const tokenResponse = result?.data?.data?.obtainKrakenToken;
  if (tokenResponse) {
    return {
      token: tokenResponse?.token,
    };
  } else {
    return {
      error: result?.data?.errors[0]?.message,
    };
  }
};

const getAccountId = async ({ token }) => {
  const response = await axios.post(
    API_URL,
    {
      query: `
             query viewer {
               viewer {
                   fullName
                   accounts {
                         number
                   }
               }
            }
         `,
      operationName: "viewer",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    }
  );

  const accountsResponse = response?.data?.data?.viewer?.accounts;
  if (accountsResponse) {
    return {
      accountId: accountsResponse[0]?.number,
    };
  } else {
    return {
      error: response?.data?.errors[0]?.message,
    };
  }
};

const fetchTariffPlan = async ({ token }) => {
  console.log("fetchTariffPlan -> in", token);
  const { accountId, error } = await getAccountId({ token });
  console.log("fetchTariffPlan -> out", accountId, error);

  if (error) {
    return { error };
  }

  const response = await axios.post(
    API_URL,
    {
      query:
        "query getProperties($accountNumber: String!, $propertiesActiveFrom: DateTime) {\n    account(accountNumber: $accountNumber) {\n        accountType\n\t\t\t\tcanRenewTariff\n        properties(activeFrom: $propertiesActiveFrom) {\n            id\n            address\n            occupancyPeriods {\n                effectiveFrom\n                effectiveTo\n            }\n            coordinates {\n                latitude\n                longitude\n            }\n            electricityMeterPoints {\n                __typename\n                mpan\n                id\n                gspGroupId\n                meters(includeInactive: false) {\n                    id\n                    serialNumber\n                    makeAndType\n                    meterType\n                    importMeter {\n                        id\n                    }\n                    smartDevices {\n                        paymentMode\n                        deviceId\n                    }\n                }\n                agreements {\n                    id\n                    validFrom\n                    validTo\n                    isRevoked\n                    tariff {\n                        __typename\n\n\n\n                        ... on HalfHourlyTariff {\n                            unitRates {\n                                value\n                                validFrom\n                                validTo\n                            }\n                        }\n\n                    }\n                }\n                enrolment {\n                    status\n                    supplyStartDate\n                    switchStartDate\n                    previousSupplier\n                }\n                smartStartDate\n                smartTariffOnboarding {\n                    id\n                    lastUpdated\n                    latestStatus\n                    latestTermsStatus\n                    smartTariffCode\n                }\n                status\n            }\n            gasMeterPoints {\n                __typename\n                mprn\n                id\n                meters {\n                    id\n                    serialNumber\n                    smartDevices {\n                        paymentMode\n                        deviceId\n                    }\n                }\n                agreements {\n                    id\n                    validFrom\n                    validTo\n                    isRevoked\n                    tariff {\n                        displayName\n                        fullName\n                        unitRate\n                        preVatUnitRate\n                        standingCharge\n                        preVatStandingCharge\n                    }\n                }\n                enrolment {\n                    status\n                    supplyStartDate\n                    switchStartDate\n                    previousSupplier\n                }\n                smartStartDate\n                status\n            }\n        }\n    }\n\n\n}",
      variables: { accountNumber: accountId },
      operationName: "getProperties",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    }
  );

  const accountResponse = response?.data?.data?.account;

  if (accountResponse) {
    return {
      tariffPlan: convertToTariffPlan(
        accountResponse.properties[0]?.electricityMeterPoints[0]?.agreements[0]
      ),
    };
  } else {
    return {
      error: response?.data?.errors[0]?.message,
    };
  }
};

module.exports = {
  fetchTariffPlan,
  obtainKrakenToken,
  getAccountId,
};
