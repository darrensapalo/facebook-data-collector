import { FacebookChatAPI } from 'facebook-chat-api';
import { Observable, from, throwError } from 'rxjs';
import logger from '../logger';
import { mergeMap, map, distinct, tap, catchError } from 'rxjs/operators';
import moment from 'moment';
import FBConversation from '../models/FBConversation';

export class ConversationService {

    public verbose: boolean = false;

    constructor(private api: FacebookChatAPI) {

    }

    private createFetchUserRequest(userID: string) {
        return new Observable(obx => {
            this.api.getUserInfo(userID, (err: Error, result) => {
                if (err) {
                    obx.error(err);
                    return console.error(err);
                }

                for (var prop in result) {
                    if (result.hasOwnProperty(prop)) {
                        var name = result[prop].name;
                        obx.next({ id: prop, name: name });
                    }
                }
                obx.complete();
            });
        });
    };

    public getUserDetailsOfLastConversations(threads: any[], size: number): Observable<any> {

        logger.info(
            "Displaying people I have talked to in the last " +
            size +
            " conversations: "
        );

        let facebookParticipants: any[] = [];

        // From the array of conversations
        return from(threads).pipe(
            // Inspect each conversation
            mergeMap(thread => {
                // To fetch details about the participants
                return (
                    this.createFetchUserRequest(thread.participantIDs)
                        // and turn the timestamps into `moment` objects.
                        .pipe(
                            map((userInfo: any) => {
                                userInfo.timestamp = moment(thread.timestamp);
                                return userInfo;
                            })
                        )

                );
            }),

            // Make sure not to have duplicates of the participant/user ids.
            distinct((s: any) => s.id),
            tap(
                pair => {
                    console.log("" + pair.name + " [" + pair.id + "]");
                    facebookParticipants.push(pair);
                },
                () => logger.error
            )
        );
    }

    /**
  * Emits a list of FB Conversations from the account of the user.
  *
  * Note that this also stores the data into a `conversations.json`.
  * @param {*} size The number of conversations to fetch.
  * @param {*} options Other options, such as `useCache`.
  */
    fetchAll(
        size: number,
        options?: FetchOptions
    ): Observable<FBConversation[]> {
        return Observable.create(obx => {
            if (options && options.useCache) {
                obx.error({
                    name: "PreferCache",
                    message: "Using cache instead of fetching [FBConversation] data."
                });
                return;
            }

            this.api.getThreadList(
                size,
                null,
                [],
                (err: Object, threads: Array<Object>) => {
                    if (err) {
                        obx.error(JSON.stringify(err, null, 2));
                        return;
                    }
                    const conversations: Array<FBConversation> = threads.map(
                        data => new FBConversation(data)
                    );

                    obx.next(conversations);
                    obx.complete();
                }
            );
        }).pipe(
            catchError(err => {
                if (this.verbose) {
                    logger.error(err);
                }

                return throwError(err);
            })
        );
    }
}

type FetchOptions = { useCache: boolean };