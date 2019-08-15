"use strict";
var moment = require('moment');
var Rx = require('rxjs/Rx');
var datasource = require('./index.js');
module.exports = {
    filterList: ['100000156092486', '100007294003380', '1392373988'],
    // True if you don't want to send messages; for debugging purposes only.
    disableMessageSending: false,
    // True if you want to see a preview of the message to be sent.
    previewMessage: false,
    remind: function (api, message, threadID, delay) {
        if (this.filterList.includes(threadID)) {
            console.log("Cancelling message to be sent; He/she is in the filter list.");
            return Rx.Observable.of();
        }
        else if (delay instanceof moment && moment().isBefore(delay)) {
            console.log("Message delayed. Will send " + delay.fromNow() + ".");
            console.log();
            return Rx.Observable.of();
        }
        else if (this.disableMessageSending || api == false) {
            console.log("Sending message... (disabled)");
            if (this.previewMessage)
                console.log(message);
            return Rx.Observable.of(threadID);
        }
        else {
            console.log("Sending message...");
            return Rx.Observable.create(function (obx) {
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
    thoseWhoHaveNotFilledUpTheFormObx: function (api, users) {
        var _this = this;
        var messageformat = process.env.MESSAGE_NOT_YET_REGISTERED;
        return Rx.Observable.from(users)
            .map(function (s) { return s.facebook_user_id; })
            .toArray()
            .do(function (x) {
            console.log("# ===================================================");
            console.log("# Current process: Message those who have not yet registered.");
            console.log("# ===================================================");
            console.log();
            console.log("Message: " + messageformat);
            console.log();
        })
            .flatMap(function (registeredUsers) {
            console.log("Who hasn't registered on my research form yet?");
            return Rx.Observable
                .from(datasource.formdevUsers)
                .filter(function (s) {
                var isRegistered = registeredUsers.includes(s.id);
                var isNotMe = s.name != 'Darren Sapalo';
                return !isRegistered && isNotMe;
            })
                .do(function (s) {
                console.log();
                console.log(" - Sending to " + s.name + " [" + s.id + "] because he/she is not yet registered.");
            })
                .flatMap(function (user) {
                var message = messageformat.replace(/%NAME%/g, user.nickname);
                if (user.message_on)
                    user.delay = moment(user.message_on, "YYYY-MM-DD HH:mm:ss");
                return _this.remind(api, message, user.id, user.delay);
            });
        })
            .toArray()
            .do(function (s) {
            console.log();
            console.log("I've talked to " + datasource.formdevUsers.length + " facis in the last 100 conversations.");
            _this.facisOnSight = datasource.formdevUsers.length;
            console.log("A total of " + s.length + " unregistered facis (no google forms) were reminded to answer the research form.");
            _this.countFacisNotRegistered = s.length;
        });
    },
    facisOnSight: 0,
    countFacisNotRegistered: 0,
    countFacisNoGDocs: 0,
    thoseWhoHaveNoGdocsObx: function (api, users, threads) {
        var _this = this;
        console.log("# ===================================================");
        console.log("# Current process: Message those who have no Gdocs yet.");
        console.log("# ===================================================");
        console.log();
        var messageformat = process.env.MESSAGE_NOT_YET_SHARED_GDOCS;
        console.log("Message: " + messageformat);
        console.log();
        var facisWithoutGdocsObx = Rx.Observable.from(users)
            .filter(function (s) { return s.gdocs == ''; })
            .map(function (s) {
            // The thread IDs are their own user ids.
            s.threadID = s.facebook_user_id;
            return s;
        })
            .toArray()
            .do(function (set) {
            _this.countFacisNoGDocs = set.length;
            console.log("There are a total of " + set.length + " facis who have no Gdocs yet, which will now be reminded.");
        })
            .flatMap(function (set) { return Rx.Observable.from(set); });
        return facisWithoutGdocsObx
            .do(function (user) { return console.log("User " + user.nickname + " has not yet submitted Gdocs."); })
            // Send a new message
            .flatMap(function (user) {
            var message = messageformat.replace(/%NAME%/g, user.nickname);
            if (user.message_on)
                user.delay = moment(user.message_on, "YYYY-MM-DD HH:mm:ss");
            return _this.remind(api, message, user.threadID, user.delay)
                .do(function (user) {
                console.log("Sent!\n");
            });
        });
    }
};
