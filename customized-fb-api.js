const fs       = require('fs');
const login    = require("facebook-chat-api");
const Tabletop = require("./tabletop.js");
const Rx       = require('rxjs/Rx');


// ==============================================================================================
// Offline mode configuration
// ==============================================================================================
var offlineMode = {

    // Will skip facebook login. Result `api` will be boolean false instead.
    noFacebookLogin: true
}


module.exports = {

	/**
	 * Logs in to messenger.
	 * {mockLogin} boolean to determine if log in should be mocked.
	 * @return A single emission which is the API object for accessing facebook messenger.
	 */
	loginObx: function() {

		return Rx.Observable.create(obx => {

			console.log("# ===================================================");
			console.log("# Current process: Logging in to Facebook Messenger.");
			console.log("# ===================================================");

			if (offlineMode.noFacebookLogin) {
				console.log("Mocked the Facebook Messenger log in process. Currently on offline mode. API is not available.");
				console.log();
				obx.next(false);
				obx.complete();

			} else {

				// Primary Log in - using app state
				login( {appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8')) }, (err, api) => {
				    
				    if(err) {

				    	console.log("Logging in to Facebook Messenger using credentials...");
						var credentials = {email: process.env.FB_USERNAME, password: process.env.FB_PASSWORD};

				    	// If failed - use credentials
				    	login(credentials, (err, api) => {
						    if(err) return console.error(err);

						    // Store credentials to app state
						    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));

						    console.log("Logged in to Facebook Messenger successfully.");
							console.log();

						    obx.next(api);
						    obx.complete();
						    
						});

				    	return console.error(err);
				    }
				    console.log("Facebook Messenger app state restored.");
				    console.log("Logged in to Facebook Messenger successfully.");
					console.log();

				    obx.next(api);
					obx.complete();
				});
			}

		});
	},

	/**
	 * @param  {api} Access to the facebook messenger API.
	 * @param  {threads} Array containing facebook conversation threads.
	 * @param  {size} How many threads were included.
	 * @return {void} Writes into the file `last.users.json`.
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