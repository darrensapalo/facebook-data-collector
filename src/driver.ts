
import { FacebookDatasource } from './datasources/facebook';
import { shareReplay, publish, mergeMap, toArray, tap } from 'rxjs/operators';
import FBConversation from '@models/FBConversation';
import User from './models/User';
import { ConnectableObservable, from } from 'rxjs';
import { ConversationService } from './services/ConversationService';
import { AirtableService } from './services/AirtableService';
import express from 'express';

require("dotenv").config();

exports.facebookDataCollector = (request: express.Request, response: express.Response) {
  const type = request.params.type;

  const fb = new FacebookDatasource();

  const facebookApi$ = fb.login({
    logLevel: "error",
    loginRequired: false
  }).pipe(shareReplay(1));

  switch (type) {
    case "add_users":
      const airtableService = new AirtableService();

      facebookApi$.subscribe(api => {

        const conversationService = new ConversationService(api);

        let conversations$ = conversationService.fetchAll(50, { useCache: false }).pipe(
          publish()
        ) as ConnectableObservable<FBConversation[]>;

        let users$ = conversations$.pipe(mergeMap(User.collect));

        const addUsersFromPastConversations$ = users$.pipe(
          tap(users => console.log("Found " + users.length + " users!")),
          mergeMap(users => from(users)),
          mergeMap(user => airtableService.addUser(user)),
          toArray()
        );

        addUsersFromPastConversations$.subscribe(users => {
          response.status(200).json(users);
        }, error => response.status(500).json(error));
      });

      break;
    case "send_messages":
      response.status(200).send("send messages");
      break;

    case "get_conversations":
      facebookApi$.subscribe(api => {
        const conversationService = new ConversationService(api);
        let conversations$ = conversationService.fetchAll(50, { useCache: false }).pipe(
          publish()
        ) as ConnectableObservable<FBConversation[]>;

        conversations$.subscribe(conversations => {
          response.status(200).json(conversations);
        }, error => response.status(500).json(error));
      });
      break;
  }
}