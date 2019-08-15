"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var fs_1 = __importDefault(require("fs"));
var API_1 = __importDefault(require("../util/API"));
var axios_1 = __importDefault(require("axios"));
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
        return rxjs_1.from(conversations)
            .pipe(operators_1.flatMap(function (conversation) { return rxjs_1.from(conversation.participants); }), operators_1.map(function (participant) { return [new User(participant)]; }), operators_1.reduce(function (prev, current, index) {
            var currentParticipant = current[0];
            // If not found
            if (!prev.find(function (p) { return p.id === currentParticipant.id; })) {
                prev.push(currentParticipant);
                return prev;
            }
            return prev;
        }), operators_1.tap(User.persistData));
    };
    User.persistData = function (users) {
        if (verbose) {
            global.mssgr.log.verbose('Attempting to persist [User] data to cache.');
        }
        var fileDestination = './static/users.json';
        var fileData = JSON.stringify(users, null, 2);
        fs_1.default.writeFileSync(fileDestination, fileData);
        if (verbose) {
            global.mssgr.log.verbose('Successfully persisted [User] data.');
        }
    };
    User.getAll = function () {
        var source$ = rxjs_1.from(axios_1.default.get(API_1.default.AirTable.LectorsAndCommentators));
        return source$.pipe(operators_1.flatMap(rxjs_1.of), operators_1.map(function (lector) { return []; }));
    };
    return User;
}());
exports.User = User;
exports.default = User;
