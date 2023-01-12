const {processHalfHourlyTariff} = require('./half-hourly');
const {logger} = require('../../logger/cloudwatch');

const processTariff = (octopusTariff) => {
  switch (octopusTariff.__typename) {
    case 'HalfHourlyTariff':
    default:
      return processHalfHourlyTariff(octopusTariff);
  }
};

const adoptProviderTariff = (octopusAgreement) => {
  try {
    return Object.assign({
      'object': 'tariff',
      'is_connected': true,
      'product_id': undefined,
      'timezone': 'Europe/London',
      'time_expiry': undefined,
      'import': undefined,
      'export': undefined,
    }, processTariff(octopusAgreement.tariff));
  } catch (e) {
    logger.error(`Can't adopt a tariff ${JSON.stringify(octopusAgreement)}`);
    logger.error(e);
    throw e;
  }
};

module.exports = {
  adoptProviderTariff,
};
