const fs       = require('fs');
const login    = require("facebook-chat-api");
const Tabletop = require("./tabletop.js");
const Rx       = require('rxjs/Rx');
const dotenv     = require('dotenv').config();


var fileCache = {

    // If you set googleSheets to `true`, then the file cache for google sheets will be used; 
    // i.e. then network requests to download the latest data for google sheets will not be performed.
    // 
    // file: `google.sheets.json`

    googleSheets: true,

    // If you set conversations to `true`, then the file cache for facebook conversations will be used; 
    // i.e. then network requests to download the latest data for facebook conversations will not be performed.
    // 
    // file: `conversations.json`
    conversations: true,

    // If you set lastUsersConversedWith to `true`, then the file cache for last users you conversed with will be used; 
    // i.e. then network requests to download the latest data for last users you conversed with will not be performed.
    // 
    // file: `last.users.json`
    lastUsersConversedWith: true
}

module.exports = {
	
	/**
	 * This is where the list of users retrieved from the google sheets are stored (file cache or network).
	 * @type {Array}
	 */
	googleSheetsUsers: JSON.parse(fs.readFileSync('google.sheets.json', 'utf8')),
	
	/**
	 * This is where the list of users retrieved from the formdev users file list are stored (file cache).
	 * @type {Array}
	 */
	formdevUsers: JSON.parse(fs.readFileSync('formdev.users.json', 'utf8')),

	/**
	 * This is where the list of conversation threads are stored (file cache or network).
	 * @type {Array}
	 */
	conversations: JSON.parse(fs.readFileSync('conversations.json', 'utf8')),

	/**
	 * Fetches the last `size` conversations in facebook.
	 * 
	 * @param  {Facebook API} api 	The object that manages the API requests for facebook messenger.
	 * @param  {int} size 			The number of conversations to fetch.
	 * 
	 * @return {array}     			An observable that emits a single array containing all the message threads.
	 */
	fbConversationsObx: function(api, size) {

		if (fileCache.conversations) {
			return Rx.Observable.create(obx => {

				var threads = JSON.parse(fs.readFileSync('conversations.json', 'utf8'));
				this.conversations = threads;

				obx.next(threads);
				obx.complete();

			});
		}

		return Rx.Observable.create(obx => {

			api.getThreadList(0, size, (err, threads) => {
		        if (err) {
		        	obx.error(err);
		        	return console.err(err);
		        }

		        fs.writeFileSync('conversations.json', JSON.stringify(threads, null, 2));
		        this.conversations = threads;

		        obx.next(threads);
		        obx.complete();

		    });

		});
	},

	/**
	 * This method is memoized. If you've called this before, the data is held in memory. No need to keep refetching.
	 *
	 * It loads the data from google sheets, and returns it as an array of JSON objects.
	 * 
	 * @return {void}  Emits a single emission of an array containing the data from google sheets.
	 */
	googleSheetsObx: function() {

		return Rx.Observable.create(obx => {

			if (fileCache.googleSheets) {

					// If loaded already, give that data.
					if (this.googleSheetsUsers.length > 0) {
						console.log("Fetching memoized google sheets data.");
						obx.next(this.googleSheetsUsers);
						obx.complete();


					// Else, load it from the file cache.
					} else {

						this.googleSheetsUsers = JSON.parse(fs.readFileSync('google.sheets.json', 'utf8'));
						obx.next(this.googleSheetsUsers);
						obx.complete();
					}
					return;
			}

			// Data already exists; return in-memory results
			if (this.googleSheetsUsers.length > 0) {
				console.log("Fetching memoized google sheets data.");
				
				obx.next(this.googleSheetsUsers);
				obx.complete();


			// else, Utilise Tabletop.js to fetch the data
			} else {
				console.log("Downloading google sheets participant data...");

				var options = {
					key: process.env.GDOCS_PARTICIPANTS_URL,

					callback: (participants, tabletop) => {
						this.googleSheetsUsers = participants;

						// File cache
						fs.writeFileSync('google.sheets.json', JSON.stringify(this.googleSheetsUsers, null, 2));

						console.log("Google sheets has a total of " + this.googleSheetsUsers.length + " entries.");
						console.log();

						obx.next(this.googleSheetsUsers);
						obx.complete();
					},

					simpleSheet: true
				}


				Tabletop.init(options);
			}

		});
	}

};