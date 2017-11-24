// Imports
const fs         = require('fs');
const Rx         = require('rxjs/Rx');
const moment     = require('moment');
const datasource = require('./formdev-datasources.js')
const fbapi      = require('./customized-fb-api.js')
const messaging  = require('./formdev-messaging.js')
const dotenv     = require('dotenv').config();


// Global variables

var researchParticipants  = [];
var facebookParticipants  = [];
var userListCache         = JSON.parse(fs.readFileSync('formdev.users.json', 'utf8'));


// public static void main(String[] args) { }

console.log('type of google sheets obx is ' + typeof(datasource.googleSheetsObx))

Rx.Observable.zip(fbapi.loginObx(), datasource.googleSheetsObx())
    .subscribe( (pair) => {

        var api = pair[0];
        var users = pair[1];

        performMainOperations(api, users);
    });



// Code

/**
 * Performs the main operations once (1) the API, (2) google sheets user data have been provided.
 * 
 * @param  {Facebook API} api   object used to interact with the facebook API.
 * @param  {array} users        array of JSON objects that hold data from google sheets.
 * @return {void}
 */
function performMainOperations(api, users){



    // Get the last 100 threads using the API, then message those participants who have no gdocs.
    var obx1 = datasource.fbConversationsObx(api, 100)
        .flatMap(threads => messaging.thoseWhoHaveNoGdocsObx(api, users, threads).toArray())

    // For those who did not fill up the form, message them too.
    var obx2 = messaging.thoseWhoHaveNotFilledUpTheFormObx(api, users).toArray();

    obx1.flatMap(s => obx2)
        .subscribe(s => {
            console.log();
            console.log("# ===================================================");
            console.log("# Reminders finished.");
            console.log("# ===================================================");
            console.log();
            console.log("Report: ");
            console.log("  " + messaging.facisOnSight + " facis to be reached via Facebook Messenger.");
            console.log();

            var totalRegistered = messaging.facisOnSight - messaging.countFacisNotRegistered;
            var percent = totalRegistered / messaging.facisOnSight * 100;

            console.log("  " + totalRegistered + " facis registered. (Progress is " + percent.toFixed(2) + "%)");
            console.log("  " + messaging.countFacisNotRegistered + " facis not registered, to be reminded.");
            console.log();

            var totalWithGdocs = totalRegistered - messaging.countFacisNoGDocs;
            percent = totalWithGdocs / totalRegistered * 100;
            
            console.log("  " + totalWithGdocs + " facis with GDocs. (Progress is " + percent.toFixed(2) + "%)");
            console.log("  " + messaging.countFacisNoGDocs + " facis without GDocs, to be reminded.");
            console.log();
            console.log();

            console.log("Interviews: ")

            console.log("   " + totalWithGdocs + " * 4 = " + (totalWithGdocs * 4) + " interview sets. (Assuming each person answered all the interview questions)");

        });
}

String.prototype.toUser = function() {
    var id = this;

    for (var i = userListCache.length - 1; i >= 0; i--) {
        var u = userListCache[i];
        if (u.id == id) return u;
    }
    return false;
}

