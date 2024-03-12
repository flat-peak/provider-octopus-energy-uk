const exactMath = require('exact-math');
const processDayNightTariff = (providerTariff) => {
  return {
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
                'valid_to': '07:00:00',
                'rate': [
                  {
					 value: exactMath.floor(exactMath.div(providerTariff.preVatNightRate || providerTariff.nightRate, 100), -2),
				  },
                ],
              },
              {
                'valid_from': '07:00:00',
                'valid_to': '00:00:00',
                'rate': [
                  {
					 value: exactMath.floor(exactMath.div(providerTariff.preVatDayRate || providerTariff.dayRate, 100), -2),
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
