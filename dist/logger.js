"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = __importStar(require("winston"));
var combine = winston_1.format.combine, timestamp = winston_1.format.timestamp, json = winston_1.format.json, label = winston_1.format.label, printf = winston_1.format.printf;
var cliFormat = winston_1.format.cli({
    colors: { info: "blue" }
});
var logger = winston_1.default.createLogger({
    level: "info",
    format: combine(timestamp(), json()),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new winston_1.default.transports.File({
            filename: "error.log",
            level: "error"
        }),
        new winston_1.default.transports.File({
            filename: "combined.log"
        })
    ]
});
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston_1.default.transports.Console({
        level: "verbose",
        format: cliFormat
    }));
}
exports.default = logger;
