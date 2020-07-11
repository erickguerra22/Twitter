'use strict'

var controller = require('../controllers/user.controller');
var jwt = require('jwt-simple');
var moment = require('moment');
var key = '0d0a546f705f7365637265745f6b6579';

exports.ensureAuth = (req, res, next) => {
    if (controller.getComand(req) == 'yes') {
        if (!req.headers.authorization) {
            return res.status(403).send({ message: 'Petición sin autorización.' });
        } else {
            var token = req.headers.authorization.replace(/['"]+/g, '');
            try {
                var payload = jwt.decode(token, key);
                if (payload.exp <= moment().unix()) {
                    return res.status(401).send({ message: 'Token Expirado' });
                }
            } catch (ex) {
                return res.status(404).send({ message: 'Token no válido.' });
            }

            req.user = payload;
            next();
        }
    }else{
        next();
    }
}