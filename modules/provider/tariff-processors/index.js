const {processHalfHourlyTariff} = require('./half-hourly');
const {logger} = require('../../logger/cloudwatch');
const {processStandardTariff} = require('./standard');

const processTariff = (providerTariff) => {
  switch (providerTariff.__typename) {
    case 'StandardTariff':
      return processStandardTariff(providerTariff);
    case 'HalfHourlyTariff':
      return processHalfHourlyTariff(providerTariff);
    default:
      throw new Error('Unknown tariff type: ' + providerTariff.__typename);
  }
};

const convert = ({agreement, tariff_code, reference_id}) => {
  try {
    return Object.assign({
      'object': 'tariff',
      'display_name': agreement.tariff.displayName,
      'reference_id': reference_id,
      'is_connected': true,
      'product_id': undefined,
      'timezone': 'Europe/London',
      'time_expiry': undefined,
      'import': undefined,
      'export': undefined,
    }, processTariff(agreement.tariff));
  } catch (e) {
    logger.error(`Can't adopt a tariff ${JSON.stringify(agreement)}`);
    logger.error(e);
    throw e;
  }
};

module.exports = {
  convert,
};
