type Participant = { id: number, name: string };
type Participants = Array<Participant>;

import { Observable, from, of } from 'rxjs';
import { map, mergeMap, reduce, tap } from 'rxjs/operators';

import logger from '../logger';
import fs from 'fs';
import API from '../util/API';
import axios from 'axios';
import FBConversation from './FBConversation';

const verbose = true;

export class User {
    id: number;
    name: string;

    constructor(participant: Participant) {
        this.id = participant.id;
        this.name = participant.name;
    }

    /**
     * Who did you last spoke to in the last N conversations?
     *
     * @returns {Observable<Array<UserID>>} - Emits a list of `UserID`s from the last `size` conversations.
     */
    static collect(conversations: FBConversation[]): Observable<User[]>{
        return from(conversations)
            .pipe(
                mergeMap(conversation => from(conversation.participants)),
                map(participant => [new User(participant)]),
                reduce((prev: Participants, current: Participants) => {
                    let currentParticipant : Participant = current[0];

                    // If not found
                    if (!prev.find(p => p.id === currentParticipant.id)) {
                        prev.push(currentParticipant);
                        return prev;
                    }

                    return prev;
                })
            );
    }

    // static persistData(users: Array<User>) : void {

    //     if (verbose) {
    //         logger.verbose('Attempting to persist [User] data to cache.');
    //     }
    //     const fileDestination = './static/users.json';
    //     const fileData = JSON.stringify(users, null, 2);

    //     fs.writeFileSync(fileDestination, fileData);

    //     if (verbose) {
    //         logger.verbose('Successfully persisted [User] data.');
    //     }

    // }


    static getAll() : Observable<Array<User>> {

        let source$ = from(axios.get(API.AirTable.LectorsAndCommentators));

        return source$.pipe(
            mergeMap(of),
            map(() => [])
        );

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

export default User;
