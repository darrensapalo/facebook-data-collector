"use strict";
// @flow
var _a = require('rxjs/Rx'), from = _a.from, Observable = _a.Observable, of = _a.of, throwError = _a.throwError;
var _b = require('rxjs/operators'), flatMap = _b.flatMap, map = _b.map, reduce = _b.reduce;
var fs = require('fs');
var verbose = true;
/**
 * Models minimally sufficient information about a facebook conversation.
 */
var FBConversation = /** @class */ (function () {
    function FBConversation(data) {
        this.id = data.threadID;
        this.name = data.name;
        this.participants = data.participants.map(function (p) {
            return { id: p.userID, name: p.name };
        });
        this.isGroupChat = data.isGroup;
    }
    /**
     * Given conversations, caches it in a file storage.
     * @param conversations
     */
    FBConversation.persistData = function (conversations) {
        if (verbose) {
            global.mssgr.log.verbose('Attempting to persist [FBConversation] data to cache.');
        }
        var fileDestination = './static/conversations.json';
        var fileData = JSON.stringify(conversations, null, 2);
        fs.writeFileSync(fileDestination, fileData);
        if (verbose) {
            global.mssgr.log.verbose('Successfully persisted [FBConversation] data.');
        }
    };
    /**
     * @returns {Array<FBConversation>} - the cache from the file storage.
     */
    FBConversation.readCache = function () {
        if (verbose) {
            global.mssgr.log.verbose('Attempting to read from cache.');
        }
        var convoData = fs.readFileSync('./static/conversations.json', 'utf8');
        var convos = JSON.parse(convoData);
        return convos;
    };
    /**
     * Emits a list of FB Conversations from the account of the user.
     *
     * Note that this also stores the data into a `conversations.json`.
     * @param {*} size The number of conversations to fetch.
     * @param {*} options Other options, such as `useCache`.
     */
    FBConversation.fetchAll = function (size, options) {
        var _this = this;
        return Observable.create(function (obx) {
            if (options && options.useCache) {
                obx.error({
                    name: 'PreferCache',
                    message: 'Using cache instead of fetching [FBConversation] data.'
                });
                return;
            }
            if (global.mssgr.fbapi === null) {
                obx.error({
                    name: 'NullError',
                    message: 'FB API was inaccessible as a dependency.'
                });
                return;
            }
            global.mssgr.fbapi.getThreadList(size, null, [], function (err, threads) {
                if (err) {
                    obx.error(JSON.stringify(err, null, 2));
                    return;
                }
                var conversations = threads.map(function (data) { return new FBConversation(data); });
                _this.persistData(conversations);
                obx.next(conversations);
                obx.complete();
            });
        })
            .catch(function (err) {
            if (verbose) {
                global.mssgr.log.error(err);
            }
            if (err.name === 'PreferCache')
                return of(_this.readCache());
            return throwError(err);
        });
    };
    return FBConversation;
}());
module.exports = FBConversation;
