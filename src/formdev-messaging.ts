import moment from "moment";
import Rx, { of } from "rxjs";
import { filter, map, mergeMap, tap, toArray } from "rxjs/operators";

export default {
  filterList: ["100000156092486", "100007294003380", "1392373988"],

  // True if you don't want to send messages; for debugging purposes only.
  disableMessageSending: false,

  // True if you want to see a preview of the message to be sent.
  previewMessage: false,

  remind: function(api, message, threadID, delay: moment.Moment) {
    if (this.filterList.includes(threadID)) {
      console.log(
        "Cancelling message to be sent; He/she is in the filter list."
      );
      return of();
    } else if (delay instanceof moment && moment().isBefore(delay)) {
      console.log("Message delayed. Will send " + delay.fromNow() + ".");
      console.log();
      return of();
    } else if (this.disableMessageSending || api == false) {
      console.log("Sending message... (disabled)");

      if (this.previewMessage) console.log(message);

      return of(threadID);
    } else {
      console.log("Sending message...");

      return Rx.Observable.create(obx => {
        api.sendMessage(message, threadID, (err, api) => {
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
