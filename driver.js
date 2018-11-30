const Rx         = require('rxjs/Rx')
const fbapi      = require('./customized-fb-api.js')
const messaging  = require('./formdev-messaging.js')
const logger     = require('./logger.js')
const { table }  = require('table')

const { User } = require('./datasources/facebook/User')
const { FBConversation } = require('./datasources/facebook/FBConversation')
const { GoogleSheets } = require('./datasources/gsheets/GoogleSheets')

let mssgr = {
    fb: {},
    log: logger
}

global.mssgr = mssgr

function refresh() {

    let updateUsers = () => {
        return FBConversation.fetchUserIDList()
            .flatMap(User.getUserInfos)
    }

    let updateConversations = () => {
        return FBConversation.fetchAll()
    }

    let updateGoogleMessages = () => {
        return GoogleSheets.fetchGSMessages()
    }

    return Rx.Observable.zip(
        updateUsers(),
        updateConversations(),
        updateGoogleMessages()
    )
}

function view(target){

}

function review(){

}

function send(){

}

function initialize(){
    return fbapi.login()
        .do(api => {
            mssgr.fb.api = api
        })
}

function displayMenu() {
    data = [
        ['Keycode', 'Description'],
        [
            'refresh', 
            'Refreshes the list of users, conversations, and googlesheets messages.'
        ],
        [
            'view X', 
            'Views the list of `users`, `conversations`, or `messages`.'
        ],
        [
            'review', 
            'Presents a table-view of the target messages to send out. This is configured from Google Sheets.'
        ],
        [
            'send', 
            'Reviews the target messages and send them.'
        ]
    ]
    
    output = table(data)
    console.log(output)
}