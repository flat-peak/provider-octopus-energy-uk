const {destructDate, calcSeconds} = require('./util');
const exactMath = require('exact-math');
const processHalfHourlyTariff = (providerTariff) => {
  const hours = providerTariff.unitRates
      .reduce((acc, rate) => {
        const {
          day: dayFrom, hours: hoursFrom, minutes: minutesFrom, seconds: secondsFrom,
        } = destructDate(rate.validFrom, 'Europe/London');
        const {
          day: dayTo, hours: hoursTo, minutes: minutesTo, seconds: secondsTo,
        } = destructDate(rate.validTo, 'Europe/London');

        if (dayFrom === dayTo) {
          acc.push({
            fromTime: calcSeconds(secondsFrom, minutesFrom, hoursFrom),
            data: {
              rate: [{value: exactMath.floor(exactMath.div(rate.value, 100), -2)}],
              valid_from: [hoursFrom, minutesFrom, secondsFrom].join(':'),
              valid_to: [hoursTo, minutesTo, secondsTo].join(':'),
            },
          });
        } else {
          acc.push({
            fromTime: calcSeconds(secondsFrom, minutesFrom, hoursFrom),
            data: {
			  rate: [{value: exactMath.floor(exactMath.div(rate.value, 100), -2)}],
              valid_from: [hoursFrom, minutesFrom, secondsFrom].join(':'),
              valid_to: '00:00:00',
            },
          }, {
            fromTime: 0,
            data: {
              rate: [{value: exactMath.floor(exactMath.div(rate.value, 100), -2)}],
              valid_from: '00:00:00',
              valid_to: [hoursTo, minutesTo, secondsTo].join(':'),
            },
          });
        }

        return acc;
      }, [])
      .sort((rateA, rateB) => rateA.fromTime - rateB.fromTime)
      .filter((rate, index, list) => index === list.findIndex((sub) => sub.fromTime === rate.fromTime))
      .map((rate) => rate.data);

  return {
    'provider_tariff_expiry_date': new Date(providerTariff.unitRates[providerTariff.unitRates.length - 1].validTo).toISOString(),
    'data': [
      {
        'days_and_hours': [
          {
            'days': [
              'All',
            ],
            'hours': hours,
          },
        ],
        'months': [
          'All',
        ],
      },
    ],
  };
};

module.exports = {processHalfHourlyTariff};
