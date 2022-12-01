const {destructDate, calcSeconds} = require("./util");
const processHalfHourlyTariff = (octopusTariff) => {
    const hours = octopusTariff.unitRates
        .reduce((acc, rate) => {
            let {
                day: dayFrom, hours: hoursFrom, minutes: minutesFrom, seconds: secondsFrom
            } = destructDate(rate.validFrom, "Europe/London");
            let {
                day: dayTo, hours: hoursTo, minutes: minutesTo, seconds: secondsTo
            } = destructDate(rate.validTo, "Europe/London");

            if (dayFrom === dayTo) {
                acc.push({
                    fromTime: calcSeconds(secondsFrom, minutesFrom, hoursFrom),
                    data: {
                        cost: rate.value,
                        valid_from: [hoursFrom, minutesFrom, secondsFrom].join(':'),
                        valid_to: [hoursTo, minutesTo, secondsTo].join(':'),
                    }
                });
            } else {
                acc.push({
                    fromTime: calcSeconds(secondsFrom, minutesFrom, hoursFrom),
                    data: {
                        cost: rate.value,
                        valid_from: [hoursFrom, minutesFrom, secondsFrom].join(':'),
                        valid_to: '00:00:00'
                    }
                },{
                    fromTime: 0,
                    data: {
                        cost: rate.value,
                        valid_from: '00:00:00',
                        valid_to: [hoursTo, minutesTo, secondsTo].join(':'),
                    }
                });
            }

            return acc;
        }, [])
        .sort((rateA, rateB) => rateA.fromTime - rateB.fromTime)
        .filter((rate, index, list) => index === list.findIndex((sub) => sub.fromTime === rate.fromTime))
        .map((rate) => rate.data);

    return {
        "time_expiry": new Date(octopusTariff.unitRates[octopusTariff.unitRates.length - 1].validTo).toISOString(),
        "import": [
            {
                "data": [
                    {
                        "days_and_hours": [
                            {
                                "days": [
                                    "All"
                                ],
                                "hours": hours
                            }
                        ],
                        "months": [
                            "All"
                        ]
                    }
                ],
                "type": "weekday"
            }
        ]
    }
}

module.exports = { processHalfHourlyTariff }
