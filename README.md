# facebook-data-collector
I had to message so many people in Facebook messenger (40+ people) repeatedly (3x a day) so I automated it.

This app logs in to your facebook account, cross references a specified public Google Sheets form, and can perform
messaging depending on the state of the respondents.

## What can it do?

This app can detect the user IDs of the people you talk to in facebook messenger, and the thread IDs of the conversations.
Given the user ID or the thread ID in facebook messenger, you can perform an API call to send or listen to messages.

> I recommend you fetch the user IDs and/or thread IDs you need first. You can do this by using the `getUserDetailsOfLastConversations` function.
Once you have the threadIDs (or user IDs in the case of a private 1-to-1 message), persist it in the Google Sheets so you don't have to do fetch
and compute this repeatedly.



## Installation

#### Step 1. Install node dependencies.

`npm install`

#### Step 2. Copy and fill up environment files.

`cp test.env .env`

#### Step 3. View and copy the structure of the Google Docs. Adjust as necessary.

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



