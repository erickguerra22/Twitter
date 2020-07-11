'user strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var tweetSchema = Schema({
    author: String,
    content: String,
    date: Date
});

module.exports = mongoose.model('tweet', tweetSchema);