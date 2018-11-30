const FBConversation = require('./datasources/facebook/FBConversation')
const User = require('./datasources/facebook/User')
const GoogleSheets = require('./datasources/gsheets/GoogleSheets')

module.exports = {
	FBConversation,
	User,
	GoogleSheets
}