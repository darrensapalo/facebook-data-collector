const Rx = require('rxjs/Rx')
const fs = require('fs')

class User {
    constructor(id) {
        this.id = id
    }

    static get(id, cache) {
        let user = User(id)

        if (cache && id in cache) {
            user.data = cache[id]
            return user
        }

        userInfos = fs.readFileSync('userdata.json', 'utf8')
        
        if (id in userInfos) {
            user.data = userInfos[id]
            return user
        }

        return undefined
    }

    /**
     * 
     * @param {array} ids The IDs of the users to get information about.
     */
    static getUserInfos(ids) {

        return Rx.Observable.create(obx => {
            
            if (!global.mssgr.fb.api) {
                obx.error('FB API was inaccessible as a dependency.')
                return
            }

            global.mssgr.fb.api.getUserInfo(ids, (err, obj) => {
                if (err) {
                    obx.error(err)
                    return
                }

                obx.next(obj)
                obx.complete()
            })

        })
        .map(userInfos => {
                    
            let data = []

            for (var key in userInfos) {
                if (userInfos.hasOwnProperty(key)){
                    let userInfo = userInfos[key]
                    
                    let entry = {
                        user_id: key,
                        user_info: userInfo
                    }
                    data.push(entry)
                }
            }

            let jsonData = JSON.stringify(data, null, 2)
            fs.writeFileSync('userdata.json', jsonData, 'utf8')
            
            return jsonData
        })
                        
    }
}

module.exports = {
    User
}