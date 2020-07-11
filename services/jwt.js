'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = '0d0a546f705f7365637265745f6b6579';

exports.createToken = (user)=>{
    var payload = {
        sub: user._id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        username: user.username,
        iat: moment().unix(),
        exp: moment().add(30, "minutes").unix()
    }
    return jwt.encode(payload,key);
}