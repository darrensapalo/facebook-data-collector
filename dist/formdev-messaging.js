"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var moment_1 = __importDefault(require("moment"));
var rxjs_1 = __importStar(require("rxjs"));
exports.default = {
    filterList: ["100000156092486", "100007294003380", "1392373988"],
    // True if you don't want to send messages; for debugging purposes only.
    disableMessageSending: false,
    // True if you want to see a preview of the message to be sent.
    previewMessage: false,
    remind: function (api, message, threadID, delay) {
        if (this.filterList.includes(threadID)) {
            console.log("Cancelling message to be sent; He/she is in the filter list.");
            return rxjs_1.of();
        }
        else if (delay instanceof moment_1.default && moment_1.default().isBefore(delay)) {
            console.log("Message delayed. Will send " + delay.fromNow() + ".");
            console.log();
            return rxjs_1.of();
        }
        else if (this.disableMessageSending || api == false) {
            console.log("Sending message... (disabled)");
            if (this.previewMessage)
                console.log(message);
            return rxjs_1.of(threadID);
        }
        else {
            console.log("Sending message...");
            return rxjs_1.default.Observable.create(function (obx) {
                api.sendMessage(message, threadID, function (err, api) {
                    if (err) {
                        console.error(err);
                        obx.error(err);
                        return console.error(err);
                    }
                    obx.next();
                    obx.complete();
                });
            });
        }
    },
};
