"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var fs_1 = __importDefault(require("fs"));
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
        fs_1.default.writeFileSync(fileDestination, fileData);
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
        var convoData = fs_1.default.readFileSync('./static/conversations.json', 'utf8');
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
        return rxjs_1.Observable.create(function (obx) {
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
                return rxjs_1.of(_this.readCache());
            return rxjs_1.throwError(err);
        });
    };
    return FBConversation;
}());
exports.FBConversation = FBConversation;
exports.default = FBConversation;
