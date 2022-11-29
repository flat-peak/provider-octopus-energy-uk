const axios = require('axios');
const {Buffer} = require("buffer");
const fs = require("fs");
const {convertToTariffPlan} = require("./tariff-processers");
const API_URL = 'https://api.octopus.energy/v1/graphql/';


const getPropertiesQuery = fs.readFileSync('./graphql/getProperties.graphql').toString();
const krakenTokenAuthenticationQuery = fs.readFileSync('./graphql/krakenTokenAuthentication.graphql').toString();
const viewerQuery = fs.readFileSync('./graphql/viewer.graphql').toString();


const isNotEmptyArray = (object) => Array.isArray(object) && object.length;

const obtainKrakenToken = async ({ email, password }) => {
   const result = await axios.post(API_URL, {
        query: krakenTokenAuthenticationQuery,
        variables: { email, password },
        operationName: "krakenTokenAuthentication",
    }, {
        headers: {
            "Content-Type": "application/json",
        }
    });

    const tokenResponse = result?.data?.data?.obtainKrakenToken;
    if (tokenResponse) {
        return  {
            token: tokenResponse?.token
        };
    } else {
        return {
            error: result?.data?.errors[0]?.message
        }
    }
}

 const getAccountId = async ({ token }) => {
     const response = await axios.post(API_URL, {
         query: viewerQuery,
         operationName: "viewer",
     }, {
         headers: {
             "Content-Type": "application/json",
             Authorization: token,
         }
     });


     const accountsResponse = response?.data?.data?.viewer?.accounts;
     if (accountsResponse) {
         return  {
             accountId: accountsResponse[0]?.number
         };
     } else {
         return {
             error: response?.data?.errors[0]?.message
         }
     }
 };

 const fetchTariffPlan = async ({ token }) => {
     console.log('fetchTariffPlan -> in', token)
     const { accountId, error} = await getAccountId({token});
     console.log('fetchTariffPlan -> out', accountId, error)

     if (error) {
         return {error}
     }

     //FIXME: request/response is corrupted for unknown reason
     const response = await axios.post(API_URL, {
         query: getPropertiesQuery,
         variables: { accountNumber: accountId },
         operationName: "getProperties",
     }, {
         headers: {
             "Content-Type": "application/json",
             Authorization: token,
         }
     });

     const accountResponse = response?.data?.data?.account;

     if (accountResponse) {
         const property = isNotEmptyArray(accountResponse.properties) && accountResponse.properties[0];
         if (!property) {
             return {
                 error: 'Property not found'
             }
         }
         let electricityMeterPoints = isNotEmptyArray(property.electricityMeterPoints) && property.electricityMeterPoints[0];
         if (!electricityMeterPoints) {
             return {
                 error: 'Meter points not found'
             }
         }

         let agreement = isNotEmptyArray(electricityMeterPoints?.agreements) && electricityMeterPoints?.agreements[0];
         if (!agreement) {
             return {
                 error: 'Agreement not found'
             }
         }
         return {
             tariffPlan: convertToTariffPlan(agreement)
         };
     } else {
         let errors = response?.data?.errors;
         return {
             error: isNotEmptyArray(errors) ? errors[0].message : 'Unknown error'
         }
     }
};

const hasValidFlatpeakCredentials = async (pubKey) => {
    await axios.get(process.env.FLATPEAK_API_URL + '/account', {
       headers: {
           "Content-Type": "application/json",
           Authorization: `Basic ${Buffer.from(pubKey + ":").toString("base64")}`
       }
   });
   return true;
}

module.exports = {
    fetchTariffPlan, obtainKrakenToken, getAccountId, hasValidFlatpeakCredentials
}
