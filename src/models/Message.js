// @flow

type UserID = number;
type Participant = { id: number, name: string };
type Participants = Array<Participant>;

const { Observable, from, of, pipe } = require('rxjs');
const { map, flatMap, toArray, reduce, tap } = require('rxjs/operators');

const logger = require('../logger');
const fs = require('fs');
const API = require('../util/API');
const axios = require('axios');
const FBConversation = require('./FBConversation');

const verbose = true;

class Message {
    id: number;


}

module.exports = Message;