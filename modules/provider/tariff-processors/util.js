const destructDate = (dateString, timeZone) => {
  const formattedDateString = new Date(dateString).toLocaleString('en-GB', {
    timeZone,
  });

  const [date, time] = formattedDateString.split(', ');
  const [day, month, year] = date.split('/');
  const [hours, minutes, seconds] = time.split(':');
  return {
    day, month, year, hours, minutes, seconds,
  };
};
const calcSeconds = (seconds, minutes, hours) => {
  return Number(seconds) + Number(minutes) * 60 + Number(hours) * 60 * 60;
};
module.exports = {
  destructDate, calcSeconds,
};
