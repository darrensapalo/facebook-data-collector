"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var facebook_chat_api_1 = __importDefault(require("facebook-chat-api"));
var moment_1 = __importDefault(require("moment"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var readline_1 = __importDefault(require("readline"));
var logger_1 = __importDefault(require("../logger"));
require("dotenv").config();
var rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
var defaultLoginOptions = {
    logLevel: "error"
};
exports.DataSource = {
    // Determines the verbosity of the log in mechanism. Set to true to view trace information.
    verbose: true,
    facebook: {
        // If true, this determines that the facebook API will be gained from a login process.
        // Otherwise, it will be gained from restoring an app state, stored in file.
        loginProcessRequired: false
    },
    /**
     * Attempts to load the Facebook API using an existing app state.
     * @private
     * @return {Observable<FacebookChatAPI>} Emits a FacebookAPI when successfully loaded. Throws an error when the app state doesn't exist.
     */
    _loadAppState: function () {
        return new rxjs_1.Observable(function (obx) {
            if (fs_1.default.existsSync("./static/appstate.json")) {
                var state = {
                    appState: JSON.parse(fs_1.default.readFileSync("./static/appstate.json", "utf8"))
                };
                // Primary Log in - using app state
                facebook_chat_api_1.default(state, defaultLoginOptions, function (err, api) {
                    if (err) {
                        logger_1.default.warn("Failed to log in using existing app state.\n");
                        obx.error(err);
                        return;
                    }
                    logger_1.default.verbose("Facebook Messenger app state restored.");
                    logger_1.default.verbose("Logged in to Facebook Messenger successfully.");
                    obx.next(api);
                    obx.complete();
                });
            }
            else {
                obx.error("App state does not yet exist.");
            }
        });
    },
    /**
     * Determines which login data to use for the log in process.
     *
     * This determines whether the whole log in process needs to be,
     * repeated or if an existing log in session will be reused.
     * @param {LoginOptions} options - The basis for how the login will be performed.
     * @returns {LoginCredentials} - The credentials to be used.
     * @private
     */
    _determineLoginData: function (options) {
        var loginData;
        logger_1.default.info("Determining how to login...");
        /// Prioritize the closest scope: Parameter scope.
        // If it states that log in is required, then follow that.
        if (options && options.loginRequired) {
            logger_1.default.info("Log in is enforced at parameter scope. Will perform a full log in process.");
            loginData = {
                email: process.env.FB_USERNAME,
                password: process.env.FB_PASSWORD
            };
        }
        else if (options && options.loginRequired === false) {
            logger_1.default.info("Log in is enforced to be skipped at parameter. Will attempt to recover state.");
            var appStateFilePath = "./static/appstate.json";
            loginData = {
                appState: JSON.parse(fs_1.default.readFileSync(appStateFilePath, "utf8"))
            };
        }
        // Otherwise, check the next closest scope: File scope.
        else if (this.facebook.loginProcessRequired) {
            logger_1.default.info("Log in is enforced at file scope . Will perform a full log in process.");
            loginData = {
                email: process.env.FB_USERNAME,
                password: process.env.FB_PASSWORD
            };
        }
        else if (fs_1.default.existsSync("./static/appstate.json")) {
            logger_1.default.info("Log in can be done by restoring app state. Will attempt to recover state.");
            var appStateFilePath = "./static/appstate.json";
            loginData = {
                appState: JSON.parse(fs_1.default.readFileSync(appStateFilePath, "utf8"))
            };
        }
        else {
            throw {
                name: "NoAppStateError",
                message: "Could not reuse an existing logged in FB session to retrieve API object because there is no existing app state."
            };
        }
        return loginData;
    },
    /**
     * Performs the log in process.
     * @param options
     * @returns {Observable<FaceBookChatAPI>}
     * @private
     */
    _loginProcess: function (options) {
        var _this = this;
        return (new rxjs_1.Observable(function (obx) {
            var handler = function (err, api) {
                if (err) {
                    switch (err.error) {
                        case "login-approval":
                            logger_1.default.verbose("Enter 2FA code > ");
                            rl.on("line", function (line) {
                                err.continue(line);
                                rl.close();
                            });
                            break;
                        default:
                            if (_this.verbose)
                                logger_1.default.error("Login Process failed. Error type: " + err.error + ". Error: " + err + ".");
                            obx.error(err);
                    }
                    return;
                }
                obx.next(api);
                obx.complete();
            };
            var loginData = _this._determineLoginData(options);
            if (options === null) {
                options = defaultLoginOptions;
            }
            facebook_chat_api_1.default(loginData, defaultLoginOptions, handler);
        })
            // After logging in successfully, persist the state.
            .pipe(operators_1.tap(this._persistAppState)));
    },
    _persistAppState: function (api) {
        // Store credentials to app state
        fs_1.default.writeFileSync("./static/appstate.json", JSON.stringify(api.getAppState(), null, 2));
        if (this.verbose) {
            logger_1.default.info("Successfully persisted app state.");
        }
    },
    /**
     * Performs the necessary operations to gain access to a Facebook Messenger API.
     *
     * @returns {Observable<FacebookChatAPI>} an API object to interface with Messenger.
     */
    login: function (options) {
        var _this = this;
        if (this.verbose) {
            logger_1.default.verbose("Logging in to Facebook Messenger...");
        }
        return this._loginProcess(options).pipe(operators_1.catchError(function (error) {
            /// Force login if it fails.
            if (error.name === "NoAppError") {
                logger_1.default.error("First try to log in failed because the app-state was missing.");
                logger_1.default.info("Attempting a fresh login.");
                var loginOptions = { loginRequired: true };
                return _this._loginProcess(loginOptions);
            }
            logger_1.default.error("Well, login failed. Too bad. " + error);
            return rxjs_1.empty();
        }), operators_1.tap(function (api) {
            if (_this.verbose)
                logger_1.default.verbose("Successfully logged in to Facebook Messenger.");
        }));
    },
    /**
     * @return {Observable<Void>} Writes into the file `last.users.json`.
     * @param {FacebookChatAPI} api - something
     * @param {Array.<MessengerThread>} threads - some text
     * @param size
     */
    getUserDetailsOfLastConversationsObx: function (api, threads, size) {
        var createFetchUserRequest = function (userID) {
            return new rxjs_1.Observable(function (obx) {
                api.getUserInfo(userID, function (err, result) {
                    if (err) {
                        obx.error(err);
                        return console.error(err);
                    }
                    for (var prop in result) {
                        if (result.hasOwnProperty(prop)) {
                            var name = result[prop].name;
                            obx.next({ id: prop, name: name });
                        }
                    }
                    obx.complete();
                });
            });
        };
        console.log("Displaying people I have talked to in the last " +
            size +
            " conversations: ");
        var facebookParticipants = [];
        // From the array of conversations
        return rxjs_1.from(threads).pipe(
        // Inspect each conversation
        operators_1.flatMap(function (thread) {
            // To fetch details about the participants
            return (createFetchUserRequest(thread.participantIDs)
                // and turn the timestamps into `moment` objects.
                .pipe(operators_1.map(function (userInfo) {
                userInfo.timestamp = moment_1.default(thread.timestamp);
                return userInfo;
            })));
        }), 
        // Make sure not to have duplicates of the participant/user ids.
        operators_1.distinct(function (s) { return s.id; }), operators_1.tap(function (pair) {
            console.log("" + pair.name + " [" + pair.id + "]");
            facebookParticipants.push(pair);
        }, function (err) { return logger_1.default.error; }, function () {
            fs_1.default.writeFileSync("last.users.json", JSON.stringify(facebookParticipants, null, 2));
            console.log();
        }));
    }
};
exports.default = exports.DataSource;
