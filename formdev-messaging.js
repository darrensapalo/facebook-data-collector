const fs         = require('fs');
const login      = require("facebook-chat-api");
const Rx         = require('rxjs/Rx');
const datasource = require('./formdev-datasources.js')


var filterList = [100000156092486, 100007294003380, 1392373988];

module.exports = {

	// True if you don't want to send messages; for debugging purposes only.
	disableMessageSending: true,

	// True if you want to see a preview of the message to be sent.
    previewMessage: false,


	remind: function(api, message, threadID) {
	    if (filterList.includes(threadID)) {
	        console.log("Ignoring message to be sent because it is in the filter list.")
	    }
	    else if (this.disableMessageSending || api == false) {
	        console.log("Sending message... (disabled)");

	        if (this.previewMessage)
	            console.log(message);
	        
	        return Rx.Observable.of(threadID);

	    } else {

	        console.log("Sending message...");

	        return Rx.Observable.create(obx => {
	            
	            api.sendMessage(message, threadID, (err, api) => {
	                
	                

	                if (err) {
	                    console.error(err);
	                    obx.error(err);
	                    return console.error(err);
	                }
	                obx.next();
	                obx.complete();

	            });
	        });
	    }
	},

	thoseWhoHaveNotFilledUpTheFormObx: function(api, users) {

	    var messageformat = "Hi %NAME%! Friendly and gentle reminder lang to fill up the research form... It takes only 2 minutes! The interview itself takes around 15-20 minutes... Sorry sa kulit ha.. Thank you %NAME%!";
	    

	    return Rx.Observable.from(users)
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

	            
	            console.log("Who hasn't registered on my research form yet?")
	            
	            return Rx.Observable
	                        .from(datasource.formdevUsers)
	                        .filter(s => {
	                            var isRegistered = registeredUsers.includes(s.id);
	                            
	                            var isNotMe = s.name != 'Darren Sapalo';

	                            return !isRegistered && isNotMe;
	                        })
	                        .do(s => {
	                            console.log()
	                            console.log(" - Sending to " + s.name + " because he/she is not yet registered");
	                        })
	                        .flatMap(user => {

	                            var message = messageformat.replace(/%NAME%/g, user.nickname);
	                            
	                            return this.remind(api, message, user.id);
	                        })
	        })
	        .toArray()
	        .do(s => {
	            console.log();
	            console.log("I've talked to " + datasource.formdevUsers.length + " facis in the last 100 conversations.");
	            this.facisOnSight = datasource.formdevUsers.length;

	            console.log("A total of " + s.length + " unregistered facis (no google forms) were reminded to answer the research form.");
	            this.countFacisNotRegistered = s.length;
	        });

	},

	facisOnSight: 0,
	countFacisNotRegistered: 0, 
	countFacisNoGDocs: 0,

	thoseWhoHaveNoGdocsObx: function(api, users, threads) {


	    console.log("# ===================================================");
	    console.log("# Current process: Message those who have no Gdocs yet.");
	    console.log("# ===================================================");
	    console.log();

	    var messageformat = "Hi %NAME%! Friendly and gentle reminder lang to answer the interview questions... It ought to take a short time lang, probably around 15-20 minutes... Thank you!";
	    console.log("Message: " + messageformat);
	    console.log();

	    var facisWithoutGdocsObx = Rx.Observable.from(users)
	        .filter(s => s.gdocs == '')
	        .map(s => {

	            // The thread IDs are their own user ids.
	            s.threadID = s.facebook_user_id;
	            return s;
	        })
	        .toArray()
	        .do(set => {
	        	this.countFacisNoGDocs = set.length;
	        	console.log("There are a total of " + set.length + " facis who have no Gdocs yet, which will now be reminded.")
	        })
	        .flatMap(set => Rx.Observable.from(set));
	        
	    return facisWithoutGdocsObx
	        .do(user => console.log("User " + user.nickname + " has not yet submitted Gdocs."))

	        // Send a new message
	        .flatMap(user => {
	        
	            var message = messageformat.replace('%NAME%', user.nickname);
	            
	            return this.remind(api, message, user.threadID)
		            .do(user => {
			            console.log("Sent!\n");
			        });
	        });
	        
	}


}