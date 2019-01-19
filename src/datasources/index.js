// @flow

// Flow Typed

type LoginCredentials = { appState?: JSON, email?: ?string, password?: ?string };
type LoginOptions = { logLevel: string, loginRequired?: boolean };
type LoginCallback = (err: Object, api: Object) => void;

// The login process for Facebook Messenger.
type FacebookLoginProcess = (loginData: LoginCredentials, options: LoginOptions, callback: LoginCallback) => void;

const fs         = require('fs');
const login : FacebookLoginProcess	 = require("facebook-chat-api");
const moment     = require('moment');
const { from, pipe, Observable, create, empty } = require('rxjs/Rx');
const { distinct, flatMap, tap, catchError } = require('rxjs/operators');

const readline = require("readline");
const logger   = require('../logger');

require('dotenv').config();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
  });

const defaultLoginOptions : LoginOptions = {
	logLevel: 'error'
};

const DataSource = {
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
	_loadAppState: function() : Observable<any> {
		return Observable.create(obx => {
			if (fs.existsSync('./static/appstate.json'))
			{
				let state : LoginCredentials = {
					appState: JSON.parse(fs.readFileSync('./static/appstate.json', 'utf8'))
				};

				// Primary Log in - using app state
				login( state, defaultLoginOptions, (err, api) => {

					if(err) {
						logger.warn("Failed to log in using existing app state.\n");
						obx.error(err);
						return
					}

					logger.verbose("Facebook Messenger app state restored.");
					logger.verbose("Logged in to Facebook Messenger successfully.");

					obx.next(api);
					obx.complete();
				})

			} else {
				obx.error('App state does not yet exist.');
			}
		})
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
	_determineLoginData: function(options?: LoginOptions) : LoginCredentials {
		let loginData : LoginCredentials;
		logger.info('Determining how to login...');

		/// Prioritize the closest scope: Parameter scope.
		// If it states that log in is required, then follow that.
		if (options && options.loginRequired) {

			logger.info('Log in is enforced at parameter scope. Will perform a full log in process.');

			loginData = {
				email: process.env.FB_USERNAME,
				password: process.env.FB_PASSWORD
			}
		} else if (options && options.loginRequired === false) {
			logger.info('Log in is enforced to be skipped at parameter. Will attempt to recover state.');

			const appStateFilePath = './static/appstate.json';

			loginData = {
				appState: JSON.parse(fs.readFileSync(appStateFilePath, 'utf8'))
			}
		} else
		// Otherwise, check the next closest scope: File scope.
		if (this.facebook.loginProcessRequired) {

			logger.info('Log in is enforced at file scope . Will perform a full log in process.');

			loginData = {
				email: process.env.FB_USERNAME,
				password: process.env.FB_PASSWORD
			}
		} else if (fs.existsSync('./static/appstate.json'))
		{
			logger.info('Log in can be done by restoring app state. Will attempt to recover state.');

			const appStateFilePath = './static/appstate.json';

			loginData = {
				appState: JSON.parse(fs.readFileSync(appStateFilePath, 'utf8'))
			}
		} else {
			throw {
				name: 'NoAppStateError',
				message: 'Could not reuse an existing logged in FB session to retrieve API object because there is no existing app state.'
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
	_loginProcess: function(options?: LoginOptions) : Observable<any> {
		return Observable.create(obx => {

			let handler : LoginCallback = (err, api) => {
				if (err) {
					switch (err.error) {

						case 'login-approval':

							logger.verbose('Enter 2FA code > ');

							rl.on('line', (line) => {
								err.continue(line);
								rl.close()
							});

							break;

						default:
							if (this.verbose) logger.error(`Login Process failed. Error type: ${err.error}. Error: ${err}.`)
							obx.error(err);
					}
					return;
				}

				obx.next(api);
				obx.complete();
			};

			let loginData = this._determineLoginData(options);

			if (options === null) {
				options = defaultLoginOptions
			}

			login(loginData, defaultLoginOptions, handler);

		})
		// After logging in successfully, persist the state.
			.pipe(tap(this._persistAppState))
	},

	_persistAppState: function(api: Object) : void {

		// Store credentials to app state

		fs.writeFileSync(
			'./static/appstate.json',
			JSON.stringify(api.getAppState(), null, 2)
		);
		if (this.verbose) {
			logger.info('Successfully persisted app state.');
		}

	},

	/**
	 * Performs the necessary operations to gain access to a Facebook Messenger API.
	 *
	 * @return {Observable<FacebookAPI>} Emits an API object to interface with Messenger.
	 */
	login: function(options?: LoginOptions) : Observable<any> {

		if (this.verbose) {
			logger.verbose("Logging in to Facebook Messenger...");
		}

		return this._loginProcess(options)
			.pipe(
				catchError(error => {

						/// Force login if it fails.
						if (error.name === 'NoAppError') {
							logger.error(`First try to log in failed because the app-state was missing.`);
							logger.info(`Attempting a fresh login.`);
							let loginOptions = { loginRequired: true };
							return this._loginProcess(loginOptions)
						}
						logger.error('Well, login failed. Too bad. ' + error);
						return empty();
					}),
				tap(api => {
					if (this.verbose)
						logger.verbose("Successfully logged in to Facebook Messenger.");
				})
			)

	},



	/**
	 * @return {Observable<Void>} Writes into the file `last.users.json`.
	 * @param {FacebookChatAPI} api - something
	 * @param {Array.<MessengerThread>} threads - some text
	 * @param size
	 */
	getUserDetailsOfLastConversationsObx: function(api: Object, threads: Array<any>, size: number): Observable<any> {

		var createFetchUserRequest = function (userID) {
			return Observable.create(obx => {

				api.getUserInfo(userID, (err, ret) => {
					if (err) {
						obx.error(err);
						return console.error(err);
					}

					for (var prop in ret) {
						if (ret.hasOwnProperty(prop)) {
							var name = ret[prop].name;
							obx.next({id: prop, name: name});

						}
					}
					obx.complete();

				});

			});
		};

		console.log("Displaying people I have talked to in the last " + size + " conversations: ");

		let facebookParticipants = [];

		// From the array of conversations
		return from(threads)
			.pipe(
				// Inspect each conversation
				flatMap((thread) => {

					// To fetch details about the participants
					return createFetchUserRequest(thread.participantIDs)

					// and turn the timestamps into `moment` objects.
						.map(userInfo => {
							userInfo.timestamp = moment(thread.timestamp);
							return userInfo;
						});
				}),

				// Make sure not to have duplicates of the participant/user ids.
				distinct(s => s.id),
				tap(
					pair => {
						console.log("" + pair.name + " [" + pair.id + "]")
						facebookParticipants.push(pair);
					},
					err => logger.error,
					() => {
						fs.writeFileSync('last.users.json', JSON.stringify(facebookParticipants, null, 2));
						console.log();
					})
			)
	}
};

module.exports = DataSource;