

const { from, Observable, of, throwError } = require('rxjs/Rx');

const { flatMap, map, reduce } = require('rxjs/operators');

const fs = require('fs');

const verbose = true;

/**
 * Models minimally sufficient information about a facebook conversation.
 */
class FBConversation {

    constructor(data) {
        this.id = data.threadID;
        this.name = data.name;
        this.participants = data.participants.map(p => {
            return { id: p.userID, name: p.name };
        });
        this.isGroupChat = data.isGroup;
    }

    /**
     * Given conversations, caches it in a file storage.
     * @param conversations
     */
    static persistData(conversations) {
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
    static readCache() {
        if (verbose) {
            global.mssgr.log.verbose('Attempting to read from cache.');
        }
        let convoData = fs.readFileSync('./static/conversations.json', 'utf8');
        let convos = JSON.parse(convoData);
        return convos;
    }

    /**
     * Emits a list of FB Conversations from the account of the user.
     * 
     * Note that this also stores the data into a `conversations.json`. 
     * @param {*} size The number of conversations to fetch.
     * @param {*} options Other options, such as `useCache`.
     */
    static fetchAll(size, options) {

        return Observable.create(obx => {
            if (options && options.useCache) {
                obx.error({
                    name: 'PreferCache',
                    message: 'Using cache instead of fetching [FBConversation] data.'
                });
                return;
            }

            if (global.mssgr.fbapi === null) {
                obx.error({
                    name: 'NullError',
                    message: 'FB API was inaccessible as a dependency.'
                });
                return;
            }

            global.mssgr.fbapi.getThreadList(size, null, [], (err, threads) => {

                if (err) {
                    obx.error(JSON.stringify(err, null, 2));
                    return;
                }
                const conversations = threads.map(data => new FBConversation(data));
                this.persistData(conversations);

                obx.next(conversations);
                obx.complete();
            });
        }).catch(err => {
            if (verbose) {
                global.mssgr.log.error(err);
            }

            if (err.name === 'PreferCache') return of(this.readCache());

            return throwError(err);
        });
    }
}

module.exports = FBConversation;