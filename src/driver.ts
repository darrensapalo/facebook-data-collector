import { zip } from 'rxjs';
import { Subject }           from 'rxjs/Rx';
import { multicast, flatMap, tap }         from 'rxjs/operators';
import fbapi      from './datasources/index';
import logger     from './logger';
import { table }  from 'table';

const FBConversation = require('./models/FBConversation');
const User = require('./models/User');

let mssgr = {
    fbapi: null,
    log: logger
}

fbapi.login({ logLevel: 'error', loginRequired: false }).subscribe(api => {
    mssgr.fbapi = api;

    let conversations$ = FBConversation.fetchAll(50, {useCache: false })
        .pipe(multicast(() => new Subject()));

    let users$ = conversations$.pipe(flatMap(User.collect));

    zip(conversations$, users$).subscribe((set: any) => {
        const conversations = set[0];
        const users = set[1];

        logger.info(`Conversations found: ${conversations.length}`);
        logger.info(`Users found: ${users.length}`);
    }, err => {
        logger.error('Oof.');
        logger.error(err);
    });

    conversations$.connect();
});

// const User = require('./models/User');
// const { FBConversation } = require('./models/FBConversation');


global.mssgr = mssgr;

function refresh() {

    // let updateUsers = () => {
    //     return FBConversation.fetchUserIDList()
    //         .flatMap(User.getUserInfos)
    // }
    //
    // let updateConversations = () => {
    //     return FBConversation.fetchAll()
    // }
    //
    // let updateGoogleMessages = () => {
    //     return GoogleSheets.fetchGSMessages()
    // }

    // return Rx.Observable.zip(
    //     updateUsers(),
    //     updateConversations(),
    //     updateGoogleMessages()
    // )
}


function initialize(){
    return fbapi.login()
        .do(api => {
            logger.verbose(api);
        })
}

function displayMenu() {
    let data = [
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
    ];

    let output = table(data);
    console.log(output);
}
