// Imports

const login    = require("facebook-chat-api");
const Tabletop = require("./tabletop.js");
const fs       = require('fs');
const Rx       = require('rxjs/Rx');
const moment   = require('moment');

require('dotenv').config();

console.log("# ===================================================");
console.log("# Current process: Logging in to Facebook Messenger.");
console.log("# ===================================================");

// Primary Log in - using app state
login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) {

    	console.log("Logging in to Facebook Messenger using credentials...");
		var credentials = {email: process.env.FB_USERNAME, password: process.env.FB_PASSWORD};

    	// If failed - use credentials
    	login(credentials, (err, api) => {
		    if(err) return console.error(err);

		    // Store credentials to app state
		    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));

		    performMainOperations(api);
		});

    	return console.error(err);
    }
    console.log("Facebook Messenger app state restored.");
    performMainOperations(api);
});


// Global variables

var researchParticipants = [];
var facebookParticipants = [];
var formdevUsers = JSON.parse(fs.readFileSync('formdev.users.json', 'utf8'));

// Code

function performMainOperations(api){
	console.log("Logged in to Facebook Messenger successfully.");
	console.log();
	

	var size = 80;
	api.getThreadList(0, size, (err, threads) => {
		if (err) return console.err(err);
		var obx1 = messageThoseWhoHaveNoGdocsObx(api, threads).toArray();
		var obx2 = messageThoseWhoHaveNotFilledUpTheForm(api).toArray();

		obx1.flatMap(s => obx2)
			.subscribe(s => {


				console.log("# ===================================================");
				console.log("# Reminders finished.");
				console.log("# ===================================================");
				console.log();

			});
	});
}

function remind(api, message, threadID) {
	console.log("Sending message... (disabled)");
	return Rx.Observable.of(threadID);

	console.log("Sending message...");
	return Rx.Observable.create(obx => {
		
		api.sendMessage(message, threadID, (err, api) => {
			
			console.log(message);

			if (err) {
				obx.error(err);
				return console.error(err);
			}
			obx.next();
			obx.complete();

		});
	});
}

function messageThoseWhoHaveNotFilledUpTheForm(api) {
	

	var messageformat = "Hi %NAME%! Friendly and gentle reminder lang to fill up the research form... It takes only 2 minutes! The interview itself takes around 15-20 minutes... Sorry sa kulit ha.. Thank you %NAME%!";
	

	return loadGoogleSheetsObx()
		.map(s => s.facebook_user_id)
		.toArray()
		.do(x => {
			console.log("# ===================================================");
			console.log("# Current process: Message those who have not yet registered.");
			console.log("# ===================================================");
			console.log();

			console.log("Message: " + messageformat);
			console.log();
		})
		.flatMap(registeredUsers => {

			console.log("I've talked to " + formdevUsers.length + " facis in the last 100 conversations.");
			console.log("Who hasn't registered on my research form yet?")

			return Rx.Observable
						.from(formdevUsers)
						.filter(s => {
							var isNotRegistered = registeredUsers.includes(s.id) == false;

							var isNotMe = s.name != 'Darren Sapalo';

							return isNotRegistered && isNotMe;
						})

		})
		.do(s => {
			console.log()
			console.log(" - " + s.name);
		})
		.flatMap(user => {

			var message = messageformat.replace('%NAME%', user.nickname);

			return remind(api, message, user.id);
		})
		.toArray()
		.do(s => {
			console.log();
			console.log("Total of " + s.length + " unregistered facis reminded.");
		});
	


}

function messageThoseWhoHaveNoGdocsObx(api, threads) {
	console.log("# ===================================================");
	console.log("# Current process: Message those who have no Gdocs yet.");
	console.log("# ===================================================");
	console.log();

	var messageformat = "Hi %NAME%! Friendly and gentle reminder lang to answer the interview questions... It ought to take a short time lang, probably around 15-20 minutes... Thank you!";
	console.log("Message: " + messageformat);
	console.log();

	var facisWithoutGdocsObx = loadGoogleSheetsObx()
		.filter(s => s.gdocs == '')
		.map(s => {

			// The thread IDs are their own user ids.
			s.threadID = s.facebook_user_id;
			return s;
		});
		
	return facisWithoutGdocsObx
		.do(user => console.log("User " + user.nickname + " has not yet submitted Gdocs."))

		// Send a new message
		.flatMap(user => {
		

			var message = messageformat.replace('%NAME%', user.nickname);
			
			return remind(api, message, user.thread);
		})


		.do(user => {
			console.log("Sent!");
			console.log();
		})
}

/**
 * @param  {api} the Facebook Messenger API.
 * @param  {threads} an array of conversation threads.
 * 
 * @return {Observable} an observable sequence that emits objects that contain the following: 
 * 						[participants], threadID, threadName, snippet, and timestamp
 * 						
 */
function getFormdevIndividualConversationsObx(api, threads) {
	return Rx.Observable.from(threads)

			// Individual messages only
			.filter(s => s.participants.length == 2)
			
			// Map to details I only need
			.map(s => {
				var result = {};

				result.participants = s.participants.map(fbUserIdToFormdevName);
				result.threadID = s.threadID;
				result.threadName = s.name;
				result.snippet = s.snippet;
				result.timestamp = moment(s.timestamp);
				return result;
			})

			.filter( s => s.participants.includes(false) == false);
}

function getConversationFromUserObx(api, threads, userid) {
	return Rx.Observable.from(threads)

			// Individual messages only
			.filter(s => s.participants.length == 2)

			.filter(s => s.participants.includes(userid))
			
			// Map to details I only need
			.map(s => {
				var result = {};

				result.participants = s.participants.map(fbUserIdToFormdevName);
				result.threadID = s.threadID;
				result.threadName = s.name;
				result.snippet = s.snippet;
				result.timestamp = moment(s.timestamp);
				return result;
			});
}

function fbUserIdToFormdevName(id) {
	for (var i = formdevUsers.length - 1; i >= 0; i--) {
		var u = formdevUsers[i];
		if (u.id == id) return u;
	}

	return false;
}


/**
 * @param  {api} Access to the facebook messenger API.
 * @param  {threads} Array containing facebook conversation threads.
 * @param  {size} How many threads were included.
 * @return {void} Writes into the file `fbUserDetailsLastConversations.json`.
 */
function getUserDetailsOfLastConversations(api, threads, size) {
	
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

	Rx.Observable
		.from(threads)
		

		.flatMap(s => {
			return createFetchUserRequest(s.participantIDs)
				.map(userInfo => {
					userInfo.timestamp = moment(s.timestamp);
					return userInfo;
				});
		})
		.distinct(s => s.id)


		.subscribe(pair => {
			console.log("" + pair.name + " [" + pair.id + "]")
			facebookParticipants.push(pair);
		}, err => console.log(err), () => {
			fs.writeFileSync('last.users.json', JSON.stringify(facebookParticipants, null, 2));
		});
}

/**
 * This method is memoized. If you've called this before, the data is held in memory. No need to keep refetching.
 * @return {void} Loads google sheets data. Emits an array containing the data from google sheets.
 */
function loadGoogleSheetsObx() {

	return Rx.Observable.create(obx => {

		var options = {
			key: process.env.GDOCS_PARTICIPANTS_URL,

			callback: (participants, tabletop) => {
				researchParticipants = participants;

				console.log("Google sheets has a total of " + researchParticipants.length + " entries.");
				console.log();

				researchParticipants.forEach(s => obx.next(s));
				obx.complete();
			},

			simpleSheet: true
		}

		if (researchParticipants.length > 0) {
			console.log("Fetching memoized google sheets data.");
			obx.next(researchParticipants);
			obx.complete();
		} else {
			console.log("Downloading google sheets participant data...");
			Tabletop.init(options);
		}

	});
	
}

/*
// Create simple echo bot
login({email: process.env.FB_USERNAME, password: process.env.FB_PASSWORD}, (err, api) => {
    if(err) return console.error(err);

    api.listen((err, message) => {
        api.sendMessage(message.body, message.threadID);
    });
});
*/