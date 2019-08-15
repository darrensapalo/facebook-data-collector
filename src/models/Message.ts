type UserID = number;
type Participant = { id: number, name: string };
type Participants = Array<Participant>;

import { Observable, from, of, pipe } from 'rxjs';
import { map, flatMap, toArray, reduce, tap } from 'rxjs/operators';

import logger from '../logger';
import fs from 'fs';
import API from '../util/API';
import axios from 'axios';
import FBConversation from './FBConversation';

const verbose = true;

class Message {
    id?: number;
}

export default Message;
