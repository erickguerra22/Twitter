'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = Schema({
    name: String,
    username: String,
    password: String,
    email: String,
    /*tweets: [{
        author: String,
        content: String,
        date: Date
    }],*/
    tweets : [{type: Schema.Types.ObjectId, ref: 'tweet'}],
    followers: [{type: Schema.Types.ObjectId, ref: 'user'}],
    following: [{type: Schema.Types.ObjectId, ref: 'user'}]
});

module.exports = mongoose.model('user', userSchema);