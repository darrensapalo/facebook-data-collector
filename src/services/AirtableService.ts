import Airtable from 'airtable';
import { defer, from, throwError, EMPTY } from 'rxjs';
import logger from '../logger';
import { cleanRowEntry } from '../util/airtable-row-mapper';
import { map, mergeMap, catchError } from 'rxjs/operators';
import User from '../models/User';
export class AirtableService {
    private airtable: Airtable;

    constructor() {
        this.airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
    }

    getSomething() {
        const base: Airtable.Base = this.airtable.base("appZgCOnu5H2ylXkg");
        const selectPendingMessages = base("Pending Messages").select({}).all();

        const pendingMessages$ = defer(() => from(selectPendingMessages))
            .pipe(
                mergeMap(records => from(records)),
                map(cleanRowEntry)
            );

        pendingMessages$.subscribe(messages => {
            logger.info(JSON.stringify(messages, null, 2));
        });
    }

    base(): Airtable.Base {
        return this.airtable.base("appZgCOnu5H2ylXkg");
    }

    addUser(user: User) {
        const createUser$ = defer(() => from(this.base()("Facebook Users").create({
            "Name": user.name,
            "Facebook ID": String(user.id)
        })));

        return this.findUser(user).pipe(
            mergeMap(results => {
                if (results.length === 0) return createUser$;
                return EMPTY;
            })
        );
    }

    findUser(user: User) {
        const findUser$ = defer(() => from(this.base()("Facebook Users").select({
            filterByFormula: "{Facebook ID} = '" + user.id + "'",
        }).all()));

        return findUser$;
    }


}