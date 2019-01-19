

const { Observable, from, of, pipe } = require('rxjs');

const { map, flatMap, toArray, reduce, tap } = require('rxjs/operators');

const logger = require('../logger');
const fs = require('fs');
const API = require('../util/API');
const axios = require('axios');
const FBConversation = require('./FBConversation');

const verbose = true;

class User {

    constructor(participant) {
        this.id = participant.id;
        this.name = participant.name;
    }

    /**
     * Who did you last spoke to in the last N conversations?
     *
     * @returns {Observable<Array<UserID>>} - Emits a list of `UserID`s from the last `size` conversations.
     */
    static collect(conversations) {
        return from(conversations).pipe(flatMap(conversation => from(conversation.participants)), map(participant => [new User(participant)]), reduce((prev, current, index, array) => {
            let currentParticipant = current[0];

            // If not found
            if (!prev.find(p => p.id === currentParticipant.id)) {
                prev.push(currentParticipant);
                return prev;
            }

            return prev;
        }), tap(User.persistData));
    }

    static persistData(users) {

        if (verbose) {
            global.mssgr.log.verbose('Attempting to persist [User] data to cache.');
        }
        const fileDestination = './static/users.json';
        const fileData = JSON.stringify(users, null, 2);

        fs.writeFileSync(fileDestination, fileData);

        if (verbose) {
            global.mssgr.log.verbose('Successfully persisted [User] data.');
        }
    }

    static getAll() {

        let source$ = from(axios.get(API.AirTable.LectorsAndCommentators));

        return source$.pipe(flatMap(of), map(lector => []));
    }

    // static get(id, cache) {
    //     let user = User(id)
    //
    //     if (cache && id in cache) {
    //         user.data = cache[id]
    //         return user
    //     }
    //
    //     userInfos = fs.readFileSync('userdata.json', 'utf8')
    //
    //     if (id in userInfos) {
    //         user.data = userInfos[id]
    //         return user
    //     }
    //
    //     return undefined
    // }

    /**
     * 
    //  * @param {array} ids The IDs of the users to get information about.
    //  */
    // static getUserInfos(ids) {
    //
    //     return Rx.Observable.create(obx => {
    //
    //         if (!global.mssgr.fb.api) {
    //             obx.error('FB API was inaccessible as a dependency.')
    //             return
    //         }
    //
    //         global.mssgr.fb.api.getUserInfo(ids, (err, obj) => {
    //             if (err) {
    //                 obx.error(err)
    //                 return
    //             }
    //
    //             obx.next(obj)
    //             obx.complete()
    //         })
    //
    //     })
    //     .map(userInfos => {
    //
    //         let data = []
    //
    //         for (var key in userInfos) {
    //             if (userInfos.hasOwnProperty(key)){
    //                 let userInfo = userInfos[key]
    //
    //                 let entry = {
    //                     user_id: key,
    //                     user_info: userInfo
    //                 }
    //                 data.push(entry)
    //             }
    //         }
    //
    //         let jsonData = JSON.stringify(data, null, 2)
    //         fs.writeFileSync('userdata.json', jsonData, 'utf8')
    //
    //         return jsonData
    //     })
    //
    // }
}

module.exports = User;