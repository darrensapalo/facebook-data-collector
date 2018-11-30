class GoogleSheets {

    constructor(url, data) {
        this.url = url
        this.data = data
    }

    static fetchGSMessages(useCache) {

        return Rx.Observable.create(obx => {
            if (useCache) {
                obx.error('Use cache instead of fetching data.')
                return
            }
    
            let options = {
                key: process.env.GDOCS_PARTICIPANTS_URL,
    
                callback: (participants, tabletop) => {
                    this.googleSheets = GoogleSheets(
                        process.env.GDOCS_PARTICIPANTS_URL, 
                        participants
                        )
                    
                    // File cache
                    fs.writeFileSync(
                        'google.sheets.json', 
                        JSON.stringify(participants, null, 2)
                    )
    
                    logger.info(
                        `Google sheets has a total of ${participants.length} entries.`
                    )
                    
                    obx.next(this.googleSheets)
                    obx.complete()
                },
    
                simpleSheet: true
            }
    
            Tabletop.init(options)
            
        })
        .catch(err => {
            // Try to get file cache
            messages = JSON.parse(fs.readFileSync('google.sheets.json', 'utf8'))
            return Rx.Observable.of(messages)
        })
    }
}

module.exports = {
    GoogleSheets
}