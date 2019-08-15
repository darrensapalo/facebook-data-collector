"use strict";
// @flow
var _a = require('rxjs'), Observable = _a.Observable, from = _a.from, of = _a.of, pipe = _a.pipe;
var _b = require('rxjs/operators'), map = _b.map, flatMap = _b.flatMap, toArray = _b.toArray, reduce = _b.reduce, tap = _b.tap;
var logger = require('../logger');
var fs = require('fs');
var API = require('../util/API');
var axios = require('axios');
var FBConversation = require('./FBConversation');
var verbose = true;
var Message = /** @class */ (function () {
    function Message() {
    }
    return Message;
}());
module.exports = Message;
