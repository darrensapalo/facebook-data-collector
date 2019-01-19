const fs       = require('fs');
const login    = require("facebook-chat-api");
const Rx       = require('rxjs/Rx');
const readline = require("readline");
const logger   = require('logger');

const dotenv     = require('dotenv').config();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
  });

const loginOptions = {
	logLevel: 'error'
};

module.exports = {
	// Determines verbosity of log in mechanism.
	verbose: false,

	offlineMode: {

		// Will skip facebook login. Result `api` will be boolean false instead.
		noFacebookLogin: false
	
	}, 

	/**
	 * Logs in to messenger.
	 * 
	 * @return An observable stream with a single emission, which is the API object for accessing facebook messenger.
	 */
	login: function() {

		return Rx.Observable.create(obx => {
			logger.verbose("Logging in to Facebook Messenger...");

			if (process.env.NO_FACEBOOK_LOGIN)
			{
				logger.verbose("Mocked the Facebook Messenger log in process. Currently on offline mode. API is not available.");
				obx.next(false);
				obx.complete();

			} 
			else if (fs.existsSync('./static/appstate.json'))
			{

				state = {
					appState: JSON.parse(
						fs.readFileSync('./static/appstate.json', 'utf8')
					)
				};

				// Primary Log in - using app state
				login( state, loginOptions, (err, api) => {
				    
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
		.catch(error => {
			
			logger.error(`First try at logging in failed. Error: ${error}\n`);

			let credentials = {
				email: process.env.FB_USERNAME, 
				password: process.env.FB_PASSWORD
			}

			return Rx.Observable.create(innerObx => {

				logger.verbose("Attemping to log in using credentials.");
				logger.verbose(credentials);

				// If failed - use credentials
				login(credentials, loginOptions, (err, api) => {

					if(!err) {
						// Store credentials to app state
						fs.writeFileSync(
							'appstate.json', 
							JSON.stringify(api.getAppState())
						)
						
						logger.info('Successfully logged in. Facebook API is available.');

						innerObx.next(api);
						innerObx.complete();
						return		
					}

					switch (err.error) {
						
						case 'login-approval':

							logger.verbose('Enter 2FA code > ');
							
							rl.on('line', (line) => {
								resu = err.continue(line);
								rl.close()
							});

							break;
						
						default:
							innerObx.error(err);
					}

				})

			})

		})
	},

	/**
	 * @return {Observable<any>} Writes into the file `last.users.json`.
	 * @param api - something
	 * @param threads - okay
	 * @param size
	 */
	getUserDetailsOfLastConversationsObx: function(api, threads, size) {
    
	    var createFetchUserRequest = function(userID) {
	        return Rx.Observable.create(obx => {

	            api.getUserInfo(userID, (err, ret) => {
	                if(err) {
	                    obx.error(err);
	                    return console.error(err);
	                }

	                for (var prop in ret) {
	                    if (ret.hasOwnProperty(prop)) {
	                        var name = ret[prop].name;
	                        obx.next ({ id: prop, name: name });
	                        
	                    }
	                }
	                obx.complete();

	            });

	        });
	    }

	    console.log("Displaying people I have talked to in the last " + size + " conversations: ");

	    facebookParticipants = [];

	    // From the array of conversations
	    return Rx.Observable.from(threads)
	        
	        // Inspect each conversation
	        .flatMap(s => {

	        	// To fetch details about the participants
	            return createFetchUserRequest(s.participantIDs)

	            	// and turn the timestamps into `moment` objects.
	                .map(userInfo => {
	                    userInfo.timestamp = moment(s.timestamp);
	                    return userInfo;
	                });
	        })

	        // Make sure not to have duplicates of the participant/user ids.
	        .distinct(s => s.id)


	        // For each results, display the pair in `NAME [USER_ID]` format.
	        .do(pair => {
	            
	            console.log("" + pair.name + " [" + pair.id + "]")
	            facebookParticipants.push(pair);

	        }, err => console.log(err), () => {
	            fs.writeFileSync('last.users.json', JSON.stringify(facebookParticipants, null, 2));
	            console.log();
	        });
	}

}