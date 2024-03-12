const exactMath = require('exact-math');
const processStandardTariff = (providerTariff) => {
  return {
    // FIXME: temporary set time_expiry as next midnight. Proper solution is needed.
    'provider_tariff_expiry_date': new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    'data': [
      {
        'months': [
          'All',
        ],
        'days_and_hours': [
          {
            'days': [
              'All',
            ],
            'hours': [
              {
                'valid_from': '00:00:00',
                'valid_to': '00:00:00',
                'rate': [{
                  'value': exactMath.floor(exactMath.div(providerTariff.unitRate, 100), -2)
                }],
              },
            ],
          },
        ],
      },
    ],
  };
};


module.exports = {processStandardTariff};
