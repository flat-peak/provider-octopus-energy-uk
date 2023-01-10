const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const USE_CLOUDWATCH = Boolean(process.env.CLOUDWATCH_GROUP_NAME);

if (USE_CLOUDWATCH) {
  const date = new Date();
  const logGroupName = process.env.CLOUDWATCH_GROUP_NAME;
  const logStreamName = [
    date.toLocaleString('en-GB').split(',').shift().split('/').reverse().join('/'),
    `${process.env.npm_package_name}#${process.env.npm_package_version}`,
  ].join(' - ');
  console.log(`USE_CLOUDWATCH: true, logGroupName: ${logGroupName}, logStreamName: ${logStreamName}`);

  winston.add(new WinstonCloudWatch({
    awsOptions: {
      credentials: {
        accessKeyId: process.env.AWS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
      region: process.env.AWS_REGION,
    },
    logGroupName: logGroupName,
    logStreamName: logStreamName,
  }));
} else {
  console.log(`USE_CLOUDWATCH: false`);
  winston.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = {
  logger: winston,
};
