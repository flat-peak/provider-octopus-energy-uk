const {processHalfHourlyTariff} = require('./half-hourly');
const {logger} = require('../../logger/cloudwatch');
const {processStandardTariff} = require('./standard');
const {processDayNightTariff} = require('./day-night');

const processTariff = (providerTariff) => {
  switch (providerTariff.__typename) {
    case 'StandardTariff':
      return processStandardTariff(providerTariff);
    case 'HalfHourlyTariff':
      return processHalfHourlyTariff(providerTariff);
    case 'DayNightTariff':
      return processDayNightTariff(providerTariff);
    default:
      throw new Error('Unknown tariff type: ' + providerTariff.__typename);
  }
};

const convert = ({agreement, tariff_code, reference_id}) => {
  try {
    return Object.assign({
      'object': 'tariff',
      'display_name': agreement.tariff.displayName,
      'timezone': 'Europe/London',
      'integration_instance': 'OCTOPUS_ENERGY_UK',
      'provider_tariff_reference': reference_id,
      'provider_tariff_expiry_date': undefined,
      'connection_type': 'DIRECT',
      'direction': 'IMPORT',
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
