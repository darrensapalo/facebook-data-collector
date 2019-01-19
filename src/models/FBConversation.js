const Rx = require('rxjs/Rx')
const fs = require('fs')

class FBConversation {
    constructor(id) {
        this.id = id
    }

    get(id) {

    }

    /**
     * Emits a list of User IDs from the conversations of a user.
     * @returns An observable sequence.
     */
    static fetchUserIDList(){
        return FBConversation.fetchAll(50)
            .flatMap(Rx.Observable.from)
            .flatMap(obj => Rx.Observable.from(obj.participantIDs))
            .map(id => [id])
            .reduce((prev, current, index, array) => {
                let currentId = current[0] 
                if (prev.indexOf(currentId) >= 0) {
                    return prev
                }
                prev.push(currentId)
                return prev
            })
    }

    /**
     * Emits a list of FB Conversations from the account of the user.
     * 
     * Note that this also stores the data into a `conversations.json`. 
     * @param {*} size The number of conversations to fetch.
     * @param {*} opts Other options, such as `useCache`.
     */
    static fetchAll(size, opts) {

        return Rx.Observable.create(obx => {
            if (opts && opts.useCache) {
                obx.error('Use cache instead of fetching data.')
                return
            }
    
            if (!global.mssgr.fb.api) {
                obx.error('FB API was inaccessible as a dependency.')
                return
            }
    
            global.mssgr.fb.api.getThreadList(0, size, (err, threads) => {
                if (err) {
                    obx.error(err)
                    return
                }
    
                fs.writeFileSync(
                    'conversations.json', JSON.stringify(threads, null, 2)
                )
    
                obx.next(threads)
                obx.complete()
    
            })
        })
        .catch(err => {
            // Try to get file cache
            let convoData = fs.readFileSync('conversations.json', 'utf8')
            let convos = JSON.parse(convoData)
            return Rx.Observable.of(convos)
        })
    
    }
}

module.exports = {
    FBConversation
}