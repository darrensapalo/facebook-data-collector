# facebook-messenger
A bootstrapping tool for sending automated messages to people in Facebook Messenger. 

> In my experience, I had to message many people in Facebook messenger (40+ people) repeatedly (3x a day). 
 > Like any sane developer, I automated my process.

## Installation

1. Download the app by zip file or clone the project.
2. Install npm dependencies by running `npm install`.
3. Configure the `.env` file so that it can log into Facebook Messenger as you.
4. Run the app using `npm run serve`. 
5. It will check your latest conversations in Messenger. It caches this information in `static/conversations.json`.
6. It stores your most recent users you've conversed with. It caches this information in `static/users.json`.

### Coming soon

1. It will utilise [Airtable](https://airtable.com) as a back end, storing your conversations, users, and messaging
state. From Airtable, you will be able to configure what messages to send to which people. It stores your state.


2. Preview the messages to be sent by running `npm run preview`. 
## Is it safe?

The source code is open for you to review. Specifically, see `.env` file and `src/datasources/index`.

## App Dependencies

This uses the following libraries:

1. [facebook-chat-api](https://github.com/Schmavery/facebook-chat-api/)
2. [rxjs](https://github.com/ReactiveX/rxjs)
3. [moment.js](https://github.com/moment/moment)
4. [dotenv](https://www.npmjs.com/package/dotenv)
5. [flow](https://www.npmjs.com/package/flow-bin)