const processStandardTariff = (providerTariff) => {
  return {
    // FIXME: temporary set time_expiry as next midnight. Proper solution is needed.
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
                    'valid_to': '00:00:00',
                    'cost': providerTariff.unitRate,
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


module.exports = {processStandardTariff};
