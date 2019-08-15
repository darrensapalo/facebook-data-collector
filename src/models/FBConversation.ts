// @flow

type FetchOptions = { useCache: boolean }
type Participant = { id: number, name: string }
type UserID = number;

const { from, Observable, of, throwError } = require('rxjs/Rx');
const { flatMap, map, reduce } = require('rxjs/operators');

const fs = require('fs');

const verbose = true;

/**
 * Models minimally sufficient information about a facebook conversation.
 */
class FBConversation {

    id: number;
    name: string;
    participants: Array<Participant>;
    isGroupChat: boolean;

    constructor(data: Object) {
        this.id = data.threadID;
        this.name = data.name;
        this.participants = data.participants.map(p => {
            return {id: p.userID, name: p.name };
        });
        this.isGroupChat = data.isGroup;
    }

    /**
     * Given conversations, caches it in a file storage.
     * @param conversations
     */
    static persistData(conversations: Array<FBConversation>) : void {
        if (verbose) {
            global.mssgr.log.verbose('Attempting to persist [FBConversation] data to cache.');
        }
        const fileDestination = './static/conversations.json';
        const fileData = JSON.stringify(conversations, null, 2);

        fs.writeFileSync(fileDestination, fileData);
        if (verbose) {
            global.mssgr.log.verbose('Successfully persisted [FBConversation] data.');
        }
    }

    /**
     * @returns {Array<FBConversation>} - the cache from the file storage.
     */
    static readCache() : Array<FBConversation> {
        if (verbose) {
            global.mssgr.log.verbose('Attempting to read from cache.');
        }
        let convoData = fs.readFileSync('./static/conversations.json', 'utf8');
        let convos : Array<FBConversation> = JSON.parse(convoData);
        return convos;
    }

    /**
     * Emits a list of FB Conversations from the account of the user.
     * 
     * Note that this also stores the data into a `conversations.json`. 
     * @param {*} size The number of conversations to fetch.
     * @param {*} options Other options, such as `useCache`.
     */
    static fetchAll(size: number, options?: FetchOptions) : Observable<Array<FBConversation>> {

        return Observable.create(obx => {
            if (options && options.useCache) {
                obx.error({
                    name: 'PreferCache',
                    message: 'Using cache instead of fetching [FBConversation] data.'
                });
                return
            }

            if (global.mssgr.fbapi === null) {
                obx.error({
                    name: 'NullError',
                    message: 'FB API was inaccessible as a dependency.'
                });
                return
            }

            global.mssgr.fbapi.getThreadList(size, null, [], (err: Object, threads: Array<Object>) => {

                if (err) {
                    obx.error(JSON.stringify(err, null, 2));
                    return
                }
                const conversations : Array<FBConversation> = threads.map(data => new FBConversation(data));
                this.persistData(conversations);

                obx.next(conversations);
                obx.complete();
    
            })
        })
        .catch((err) => {
            if (verbose) {
                global.mssgr.log.error(err);
            }

            if (err.name === 'PreferCache')
                return of(this.readCache());

            return throwError(err);
        })
    
    }
}

module.exports = FBConversation;