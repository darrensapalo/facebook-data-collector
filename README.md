# facebook-messenger
A scaffolding tool for loading and analyzing your conversations and user list in your Facebook Messenger. 

## Installation

1. Download the app by zip file or clone the project.
2. Install npm dependencies by running `npm install`.
3. Copy `test.env` into a new file named `.env`, and configure your username and password.
4. Run the app using `npm run serve`. 
5. It will check your latest conversations in Messenger. It caches this information in `static/conversations.json`.
6. It stores your most recent users you've conversed with. It caches this information in `static/users.json`.

### Coming soon

1. Add `sqlite` as a mechanism for storing local data (conversations, users, messaging states).

## Are my access credentials safe?

The source code is open for you to review. Specifically, you can review the interaction between the `.env` file and `src/datasources/facebook.ts`.

## Rationale and Future Plans

See the [wiki](https://github.com/darrensapalo/facebook-data-collector/wiki).

## App Dependencies

This uses the following libraries:

1. [facebook-chat-api](https://github.com/Schmavery/facebook-chat-api/)
2. [rxjs](https://github.com/ReactiveX/rxjs)
3. [moment.js](https://github.com/moment/moment)
4. [dotenv](https://www.npmjs.com/package/dotenv)
5. [flow](https://www.npmjs.com/package/flow-bin)
