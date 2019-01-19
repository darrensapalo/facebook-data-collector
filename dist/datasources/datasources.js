

const fs = require('fs');

// The login process for Facebook Messenger.


// Flow Typed

const login = require("facebook-chat-api");
const moment = require('moment');
const { from, pipe, Observable, create } = require('rxjs/Rx');
const { distinct, flatMap, tap } = require('rxjs/operators');

const readline = require("readline");
const logger = require('../logger');

require('dotenv').config();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const loginOptions = {
	logLevel: 'error'
};

const DataSource = {
	// Determines the verbosity of the log in mechanism. Set to true to view trace information.
	verbose: false,

	facebook: {
		// Determines whether facebook API will be available or not.
		isOnline: true
	},

	/**
  * Attempts to load the Facebook API using an existing app state.
  * @private
  * @return {Observable<FacebookChatAPI>} Emits a FacebookAPI when successfully loaded. Throws an error when the app state doesn't exist.
  */
	_loadAppState: function () {
		return Observable.create(obx => {
			if (fs.existsSync('./static/appstate.json')) {
				let state = {
					appState: JSON.parse(fs.readFileSync('./static/appstate.json', 'utf8'))
				};

				// Primary Log in - using app state
				login(state, loginOptions, (err, api) => {

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
				obx.error('App state does not yet exist.');
			}
		});
	},

	/**
  * Performs the log in operation for Facebook Messenger.
  *
  * @return {Observable<FacebookAPI>} observable stream that, on successful login, emits an
  * API object for accessing facebook messenger.
  */
	login: function () {

		return Observable.create(obx => {

			if (this.verbose) {
				logger.verbose("Logging in to Facebook Messenger...");
			}

			if (this.facebook.isOnline === false) {
				if (this.verbose) {
					logger.verbose("Mocked the Facebook Messenger log in process.");
					logger.verbose("Currently on offline mode. API is not available.");
				}
				obx.next(false);
				obx.complete();
				return;
			}

			this._loadAppState();
		}).catch(error => {

			logger.error(`First try at logging in failed. Error: ${error}\n`);

			let credentials = {
				email: process.env.FB_USERNAME,
				password: process.env.FB_PASSWORD
			};

			return Observable.create(innerObx => {

				logger.verbose("Attemping to log in using credentials.");
				logger.verbose(credentials);

				// If failed - use credentials
				login(credentials, loginOptions, (err, api) => {

					if (!err) {
						// Store credentials to app state

						fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState(), null, 2));

						logger.info('Successfully logged in. Facebook API is available.');

						innerObx.next(api);
						innerObx.complete();
						return;
					}

					switch (err.error) {

						case 'login-approval':

							logger.verbose('Enter 2FA code > ');

							rl.on('line', line => {
								err.continue(line);
								rl.close();
							});

							break;

						default:
							innerObx.error(err);
					}
				});
			});
		});
	},

	/**
  * @return {Observable<Void>} Writes into the file `last.users.json`.
  * @param {FacebookChatAPI} api - something
  * @param {Array.<MessengerThread>} threads - some text
  * @param size
  */
	getUserDetailsOfLastConversationsObx: function (api, threads, size) {

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
							obx.next({ id: prop, name: name });
						}
					}
					obx.complete();
				});
			});
		};

		console.log("Displaying people I have talked to in the last " + size + " conversations: ");

		let facebookParticipants = [];

		// From the array of conversations
		return from(threads).pipe(
		// Inspect each conversation
		flatMap(thread => {

			// To fetch details about the participants
			return createFetchUserRequest(thread.participantIDs)

			// and turn the timestamps into `moment` objects.
			.map(userInfo => {
				userInfo.timestamp = moment(thread.timestamp);
				return userInfo;
			});
		}),

		// Make sure not to have duplicates of the participant/user ids.
		distinct(s => s.id), tap(pair => {
			console.log("" + pair.name + " [" + pair.id + "]");
			facebookParticipants.push(pair);
		}, err => logger.error, () => {
			fs.writeFileSync('last.users.json', JSON.stringify(facebookParticipants, null, 2));
			console.log();
		}));
	}
};

module.exports = DataSource;