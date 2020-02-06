import logger from "./logger";

import { FacebookDatasource } from './datasources/facebook';
import { shareReplay, publish, mergeMap, toArray } from 'rxjs/operators';
import FBConversation from '@models/FBConversation';
import User from './models/User';
import { zip, ConnectableObservable, from } from 'rxjs';
import { ConversationService } from './services/ConversationService';
import { AirtableService } from './services/AirtableService';

require("dotenv").config();


function main() {

  const fb = new FacebookDatasource();

  const facebookApi$ = fb.login({
    logLevel: "error",
    loginRequired: false
  }).pipe(shareReplay(1));

  const airtableService = new AirtableService();

  facebookApi$.subscribe(api => {

    const conversationService = new ConversationService(api);

    let conversations$ = conversationService.fetchAll(50, { useCache: false }).pipe(
      publish()
    ) as ConnectableObservable<FBConversation[]>;

    let users$ = conversations$.pipe(mergeMap(User.collect));

    const addUsersFromPastConversations$ = users$.pipe(
      mergeMap(users => from(users)),
      mergeMap(user => airtableService.addUser(user)),
      toArray()
    );

    addUsersFromPastConversations$.subscribe(console.log);

    //   zip(conversations$, users$).subscribe(
    //     (set: any) => {
    //       const conversations = set[0];
    //       const users = set[1];

    //       logger.info(`Conversations found: ${conversations.length}`);
    //       logger.info(`Users found: ${users.length}`);
    //     },
    //     err => {
    //       logger.error("Oof.");
    //       logger.error(err);
    //     }
    //   );

    //   conversations$.connect();

  });
};

main();
