import { Datasource } from '@interfaces/datasources';
import { Observable, EMPTY, throwError } from 'rxjs';
import fs from 'fs';
import login,{ LoginCallback, LoginOptions, LoginCredentials } from 'facebook-chat-api';
import logger from '../logger';
import { tap, catchError } from 'rxjs/operators';
import { FacebookChatAPI } from 'facebook-chat-api';
import readline from "readline";

export class FacebookDatasource implements Datasource {

    private loginProcessRequired: boolean = true;

    public verbose: boolean = true;

    private defaultLoginOptions: LoginOptions = {
        logLevel: "error",
        loginRequired: false
    };


    /**
   * Attempts to load the Facebook API using an existing app state.
   * @private
   * @return {Observable<FacebookChatAPI>} Emits a FacebookAPI when successfully loaded. Throws an error when the app state doesn't exist.
   */
    private loadFacebookAPIFromCachedAppState(): Observable<FacebookChatAPI> {
        return new Observable(obx => {
            if (fs.existsSync("./static/appstate.json")) {
                let state: LoginCredentials = {
                    appState: JSON.parse(
                        fs.readFileSync("./static/appstate.json", "utf8")
                    )
                };

                // Primary Log in - using app state
                login(state, this.defaultLoginOptions, (err, api) => {
                    if (err) {
                        logger.warn("Failed to log in using existing app state.\n");
                        obx.error(err);
                        return;
                    }

                    logger.verbose("Facebook Messenger app state restored.");
                    logger.verbose("Logged in to Facebook Messenger successfully.");

                    obx.next(api);
                    obx.complete();
                });
            } else {
                obx.error(Error("App state does not exist."));
            }
        });
    }

    /**
     * Determines which login data to use for the log in process.
     *
     * This determines whether the whole log in process needs to be,
     * repeated or if an existing log in session will be reused.
     * @param {LoginOptions} options - The basis for how the login will be performed.
     * @returns {LoginCredentials} - The credentials to be used.
     * @private
     */
    determineLoginData(options?: LoginOptions): LoginCredentials {
        let loginData: LoginCredentials;
        logger.info("Determining how to login...");

        /// Prioritize the closest scope: Parameter scope.
        // If it states that log in is required, then follow that.
        if (options && options.loginRequired) {
            logger.info(
                "Log in is enforced at parameter scope. Will perform a full log in process."
            );

            loginData = {
                email: process.env.FB_USERNAME,
                password: process.env.FB_PASSWORD
            };
            logger.info("details", loginData);
            logger.info(`${process.env.FB_USERNAME} ${process.env.FB_PASSWORD}`);
        } else if (options && options.loginRequired === false) {
            logger.info(
                "Log in is enforced to be skipped at parameter. Will attempt to recover state."
            );

            const appStateFilePath = "./static/appstate.json";

            loginData = {
                appState: JSON.parse(fs.readFileSync(appStateFilePath, "utf8"))
            };
        }
        // Otherwise, check the next closest scope: File scope.
        else if (this.loginProcessRequired) {
            logger.info(
                "Log in is enforced at file scope . Will perform a full log in process."
            );

            loginData = {
                email: process.env.FB_USERNAME,
                password: process.env.FB_PASSWORD
            };
        } else if (fs.existsSync("./static/appstate.json")) {
            logger.info(
                "Log in can be done by restoring app state. Will attempt to recover state."
            );

            const appStateFilePath = "./static/appstate.json";

            loginData = {
                appState: JSON.parse(fs.readFileSync(appStateFilePath, "utf8"))
            };
        } else {
            throw {
                name: "NoAppStateError",
                message:
                    "Could not reuse an existing logged in FB session to retrieve API object because there is no existing app state."
            };
        }

        return loginData;
    }

    /**
     * Performs the log in process.
     * @param options
     * @returns {Observable<FaceBookChatAPI>}
     * @private
     */
    actualLoginProcess(options?: LoginOptions): Observable<FacebookChatAPI> {
        return (
            new Observable(obx => {
                let handler: LoginCallback = (err, api) => {
                    if (err) {
                        switch (err.error) {
                            case "login-approval":
                                logger.verbose("Enter 2FA code > ");

                                const rl = readline.createInterface({
                                    input: process.stdin,
                                    output: process.stdout
                                });

                                rl.on("line", line => {
                                    logger.info("Received input: " + line);
                                    err.continue(line);
                                    rl.close();
                                });

                                break;

                            default:
                                if (this.verbose)
                                    logger.error(
                                        `Login Process failed. Error type: ${err.error}.`, err
                                    );
                                obx.error(err);
                        }
                        return;
                    }

                    obx.next(api);
                    obx.complete();
                };

                let loginData = this.determineLoginData(options);

                if (options === null) {
                    options = this.defaultLoginOptions;
                }

                login(loginData, this.defaultLoginOptions, handler);
            })
                // After logging in successfully, persist the state.
                .pipe(tap(this.persistAppState))
        );
    }

    private persistAppState(api: any): void {
        // Store credentials to app state

        fs.writeFileSync(
            "./static/appstate.json",
            JSON.stringify(api.getAppState(), null, 2)
        );

        if (this.verbose) {
            logger.info("Successfully persisted app state.");
        }
    }

    /**
     * Performs the necessary operations to gain access to a Facebook Messenger API.
     *
     * @returns {Observable<FacebookChatAPI>} an API object to interface with Messenger.
     */
    login(options?: LoginOptions): Observable<FacebookChatAPI> {
        if (this.verbose) {
            logger.verbose("Logging in to Facebook Messenger...");
        }

        return this.loadFacebookAPIFromCachedAppState().pipe(
            catchError(error => {
                /// Force login if it fails.
                if (/App state does not exist/.test(error.message)) {
                    logger.warn(
                        `First try to log in failed because the app-state was missing.`
                    );
                    logger.debug(`Attempting a fresh login.`);

                    return this.actualLoginProcess({ ...options, loginRequired: true });
                }
                    logger.error("Attempt to login from the stored app state failed.");
                return throwError(error);
            }),
            tap(() => {
                if (this.verbose)
                    logger.verbose("Successfully logged in to Facebook Messenger.");
            })
        );
    }

}