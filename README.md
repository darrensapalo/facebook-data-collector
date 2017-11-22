# facebook-data-collector
I had to message so many people in Facebook messenger (40+ people) repeatedly (3x a day) so I automated it.

## What can it do?

This app logs in to your facebook account, cross references a specified public Google Sheets form to determine what kind of message to send to a person, and then sends a message using your personal Facebook account to the said person depending on the state defined by the Google Sheets form.

## Example scenario

For example, I have a Google Sheets form that lists all the people that have registered through my Google Forms. However, I need to get more people to fill up my form. 

So I have two messages:

1. The registered ones (those who answered Google Forms) are reminded to answer a questionnaire.
2. The non registered ones (whose user IDs I know from facebook, but have not yet answered Google Forms) are reminded to answer the Google Form.

## Notes

I recommend you fetch the user IDs and/or thread IDs you need first. You can do this by using the `getUserDetailsOfLastConversations` function. Once you have the threadIDs (or user IDs in the case of a private 1-to-1 message), persist it in the Google Sheets so you don't have to do fetch and compute this repeatedly.

## Installation

#### Step 1. Install node dependencies.

`npm install`

#### Step 2. Copy and fill up environment files.

`cp test.env .env`

#### Step 3. View and copy the structure of the [sample Google Docs](https://docs.google.com/spreadsheets/d/1rV18RdRyzRfOuoSAhs4LAKNlHDNQ3OpAv9DLznAyq_E/edit?usp=sharing). Adjust as necessary.

#### Step 4. Run the driver code.

`node driver.js`

When the state of the message for a certain user will change (e.g. Instead of 'please register', they must now 'please answer the interview questions')
then you can adjust the Google Sheets, run the app, and the message will adapt.

# Documentation

### `function getUserDetailsOfLastConversations(api, threads, size)`

This method allows you to get the user details of your past N conversations in messenger, and persists it in a file named `last.users.json`.
This contains the user ID of the people you conversed with, along with their names.


### `function remind(api, message, threadID)`

This method sends a specified message to the given threadID using the API. Note that this returns an `Rx.Observable` which must be subscribed to
in order to perform the send message HTTP request.


# Dependencies

This uses the following libraries:
1. [facebook-chat-api](https://github.com/Schmavery/facebook-chat-api/)
2. [tabletop.js](https://github.com/jsoma/tabletop)
3. [rxjs](https://github.com/ReactiveX/rxjs)
4. [moment.js](https://github.com/moment/moment)
5. [dotenv](https://www.npmjs.com/package/dotenv)
