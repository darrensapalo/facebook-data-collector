"use strict";
// @flow
var _a = require('rxjs'), Observable = _a.Observable, from = _a.from, of = _a.of, pipe = _a.pipe;
var _b = require('rxjs/operators'), map = _b.map, flatMap = _b.flatMap, toArray = _b.toArray, reduce = _b.reduce, tap = _b.tap;
var logger = require('../logger');
var fs = require('fs');
var API = require('../util/API');
var axios = require('axios');
var FBConversation = require('./FBConversation');
var verbose = true;
var User = /** @class */ (function () {
    function User(participant) {
        this.id = participant.id;
        this.name = participant.name;
    }
    /**
     * Who did you last spoke to in the last N conversations?
     *
     * @returns {Observable<Array<UserID>>} - Emits a list of `UserID`s from the last `size` conversations.
     */
    User.collect = function (conversations) {
        return from(conversations)
            .pipe(flatMap(function (conversation) { return from(conversation.participants); }), map(function (participant) { return [new User(participant)]; }), reduce(function (prev, current, index, array) {
            var currentParticipant = current[0];
            // If not found
            if (!prev.find(function (p) { return p.id === currentParticipant.id; })) {
                prev.push(currentParticipant);
                return prev;
            }
            return prev;
        }), tap(User.persistData));
    };
    User.persistData = function (users) {
        if (verbose) {
            global.mssgr.log.verbose('Attempting to persist [User] data to cache.');
        }
        var fileDestination = './static/users.json';
        var fileData = JSON.stringify(users, null, 2);
        fs.writeFileSync(fileDestination, fileData);
        if (verbose) {
            global.mssgr.log.verbose('Successfully persisted [User] data.');
        }
    };
    User.getAll = function () {
        var source$ = from(axios.get(API.AirTable.LectorsAndCommentators));
        return source$.pipe(flatMap(of), map(function (lector) { return []; }));
    };
    return User;
}());
module.exports = User;
