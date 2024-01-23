const exactMath = require('exact-math');
const processDayNightTariff = (providerTariff) => {
  return {
    'time_expiry': new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    'import': [
      {
        'type': 'weekday',
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
                    'valid_to': '07:00:00',
                    'cost': exactMath.div(providerTariff.preVatNightRate || providerTariff.nightRate, 100),
                  },
                  {
                    'valid_from': '07:00:00',
                    'valid_to': '00:00:00',
                    'cost': exactMath.div(providerTariff.preVatDayRate || providerTariff.dayRate, 100),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
};


module.exports = {processDayNightTariff};
