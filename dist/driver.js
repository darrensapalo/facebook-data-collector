"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var index_1 = __importDefault(require("./datasources/index"));
var logger_1 = __importDefault(require("./logger"));
var table_1 = require("table");
var FBConversation_1 = __importDefault(require("./models/FBConversation"));
var User_1 = __importDefault(require("./models/User"));
var mssgr = {
    fbapi: null,
    log: logger_1.default
};
index_1.default.login({ logLevel: "error", loginRequired: false }).subscribe(function (api) {
    mssgr.fbapi = api;
    var conversations$ = FBConversation_1.default.fetchAll(50, { useCache: false }).pipe(operators_1.publish());
    var users$ = conversations$.pipe(operators_1.flatMap(User_1.default.collect));
    rxjs_1.zip(conversations$, users$).subscribe(function (set) {
        var conversations = set[0];
        var users = set[1];
        logger_1.default.info("Conversations found: " + conversations.length);
        logger_1.default.info("Users found: " + users.length);
    }, function (err) {
        logger_1.default.error("Oof.");
        logger_1.default.error(err);
    });
    conversations$.connect();
});
// const User = require('./models/User');
// const { FBConversation } = require('./models/FBConversation');
global.mssgr = mssgr;
function refresh() {
    // let updateUsers = () => {
    //     return FBConversation.fetchUserIDList()
    //         .flatMap(User.getUserInfos)
    // }
    //
    // let updateConversations = () => {
    //     return FBConversation.fetchAll()
    // }
    //
    // let updateGoogleMessages = () => {
    //     return GoogleSheets.fetchGSMessages()
    // }
    // return Rx.Observable.zip(
    //     updateUsers(),
    //     updateConversations(),
    //     updateGoogleMessages()
    // )
}
function initialize() {
    return index_1.default.login().pipe(operators_1.tap(function (api) {
        logger_1.default.verbose(api);
    }));
}
function displayMenu() {
    var data = [
        ["Keycode", "Description"],
        [
            "refresh",
            "Refreshes the list of users, conversations, and googlesheets messages."
        ],
        ["view X", "Views the list of `users`, `conversations`, or `messages`."],
        [
            "review",
            "Presents a table-view of the target messages to send out. This is configured from Google Sheets."
        ],
        ["send", "Reviews the target messages and send them."]
    ];
    var output = table_1.table(data);
    console.log(output);
}
