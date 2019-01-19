const winston = require('winston');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, label, printf } = format;

let cliFormat = format.cli({
    colors: { info: 'blue' }
});

const logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), json()),
    transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({
        filename: 'error.log',
        level: 'error'
    }), new winston.transports.File({
        filename: 'combined.log'
    })]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        level: 'verbose',
        format: cliFormat
    }));
}

module.exports = logger;