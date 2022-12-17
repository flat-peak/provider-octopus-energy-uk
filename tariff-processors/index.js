const {processHalfHourlyTariff} = require('./half-hourly');

const processTariff = (octopusTariff) => {
  switch (octopusTariff.__typename) {
    case 'HalfHourlyTariff':
    default:
      return processHalfHourlyTariff(octopusTariff);
  }
};

const convertToTariff = (octopusAgreement) => {
  return Object.assign({
    'object': 'tariff',
    'is_connected': true,
    'product_id': undefined,
    'timezone': 'Europe/London',
    'time_expiry': undefined,
    'import': undefined,
    'export': undefined,
  }, processTariff(octopusAgreement.tariff));
};

module.exports = {
  convertToTariff,
};
