'use strict'

var User = require('../models/user.model');
var Tweet = require('../models/tweet.model');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');

function getComand(req) {
    var params = req.body;
    var respuesta;
    if (params.comand) {
        var comand = params.comand.split(" ");
        comand = comand[0];
        comand = comand.toUpperCase();
        if (comand == 'LOGIN' || comand == 'REGISTER' || comand == '?') {
            respuesta = 'no';
        } else {
            respuesta = 'yes';
        }
    } else {
        respuesta = 'yes';
    }
    return respuesta;
}

function comands(req, res) {
    var params = req.body;
    if (params.comand) {
        var instruction = params.comand;
        var parametro = instruction.split(' ');
        var comando = parametro[0];
        parametro.splice(0, 1);
        comando = comando.toUpperCase();
        switch (comando) {
            case '?':
                res.send({
                    '¡Bienvenido!': 'Lista de comandos disponibles:',
                    'LOGIN username/email password': 'Para iniciar sesión.',
                    'PROFILE username': 'Para ver los datos públicos de un usuario.',
                    'REGISTER name lastname email username password': 'Para registrar un nuevo usuario',
                    'VIEW_TWEET username': 'Para ver todos los tweets agregados de un usuario',
                    'ADD_TWEET textoDelTweet': 'Para añadir un nuevo tweet a su perfil',
                    'EDIT_TWEET idTweet textoDelNuevoTweet': 'Para editar un tweet ya agregado a su perfil',
                    'DELETE_TWEET idTweet': 'Elimina un tweet ya agregado en el perfil',
                    'FOLLOW username': 'Para agregar a un usuario a tu lista de personas que sigues.',
                    'UNFOLLOW username': 'Para eliminar a un usuario de tu lista de personas que sigues'
                })
                break;
            case 'PROFILE':
                if (parametro.length != 1) {
                    res.status(400).send({ message: 'La cantidad de parámetros introducida no es correcta;' });
                } else {
                    var username = parametro[0].toLowerCase();
                    profile(username, req, res);
                }
                break;
            case 'LOGIN':
                if (parametro.length != 2) {
                    res.status(400).send({ message: 'La cantidad de parámetros introducida no es correcta;' });
                } else {
                    var username = parametro[0].toLowerCase();
                    var password = parametro[1];
                    login(username, password, req, res);
                }
                break;
            case 'REGISTER':
                if (parametro.length == 4) {
                    var name = parametro[0];
                    var email = parametro[1].toLowerCase();
                    var username = parametro[2].toLowerCase();
                    var password = parametro[3];
                    register(name, email, username, password, res);
                } else if (parametro.length == 5) {
                    var name = parametro[0] + ' ' + parametro[1];
                    var email = parametro[2].toLowerCase();
                    var username = parametro[3].toLowerCase();
                    var password = parametro[4];
                    register(name, email, username, password, res);
                } else {
                    res.status(400).send({ message: 'La cantidad de parámetros introducida no es correcta;' });
                }
                break;
            case 'ADD_TWEET':
                var content = parametro.toString().replace(/[,]+/g, ' ');
                if (content.length > 280) {
                    res.status(400).send({ message: 'Ha superado el límite de caracteres (280 por tweet.)' });
                } else {
                    add_tweet(content, req, res);
                }
                break;
            case 'DELETE_TWEET':
                if (parametro.length != 1) {
                    res.status(400).send({ message: 'La cantidad de parámetros introducida no es correcta;' });
                } else {
                    var idT = parametro;
                    delete_tweet(idT, req, res);
                }
                break;
            case 'EDIT_TWEET':
                var idT = parametro[0];
                parametro.splice(0, 1);
                var newContent = parametro.toString().replace(/[,]+/g, ' ');
                if (newContent.length > 280) {
                    res.status(400).send({ message: 'Ha superado el límite de caracteres (280 por tweet.)' });
                } else {
                    edit_tweet(idT, newContent, req, res);
                }
                break;
            case 'VIEW_TWEETS':
                if (parametro.length != 1) {
                    res.status(400).send({ message: 'La cantidad de parámetros introducida no es correcta.' });
                } else {
                    var username = parametro[0].toLowerCase();
                    view_tweets(username, res);
                }
                break;
            case 'FOLLOW':
                if (parametro.length != 1) {
                    res.status(400).send({ message: 'La cantidad de parámetros introducida no es correcta.' });
                } else {
                    var username = parametro[0].toLowerCase();
                    follow(username, req, res);
                }
                break;
            case 'UNFOLLOW':
                if (parametro.length != 1) {
                    res.status(400).send({ message: 'La cantidad de parámetros introducida no es correcta.' });
                } else {
                    var username = parametro[0].toLowerCase();
                    unfollow(username, req, res);
                }
                break;
            default:
                res.send({ message: " '" + comando +  "' no se reconoce como un comando registrado, intente con otro o ingrese '?' para ver la lista de comandos." });
                break;
        }
    } else {
        res.status(400).send({ message: 'Ingrese un comando o "?" para ver la lista de comandos.' })
    }
}

function register(name, email, username, password, res) {
    var user = new User;

    if (name && email && username && password) {
        User.find({ $or: [{ username: username }, { email: email }] }, (err, found) => {
            if (err) {
                res.status(500).send({ error: 'Error interno del servidor.', err });
            } else if (found != '') {
                res.status(202).send({ message: 'El nombre de usuario o dirección de email ingresados ya están en uso.' });
            } else {
                user.name = name;
                user.username = username;
                user.email = email;

                bcrypt.hash(password, null, null, (err, passwordHashed) => {
                    if (err) {
                        res.status(500).send({ error: 'Error interno del servidor.', err });
                    } else if (passwordHashed) {
                        user.password = passwordHashed;

                        user.save((err, saved) => {
                            if (err) {
                                res.status(500).send({ error: 'Error interno del servidor.' });
                            } else if (saved) {
                                res.send({
                                    'Usuario Registrado': saved._id,
                                    'Username': saved.username,
                                    'Name': saved.name,
                                    'Email': saved.email,
                                    'Password': saved.password,
                                    'Tweets': saved.tweets.length,
                                    'Followers': saved.followers.length,
                                    'Following': saved.following.length
                                });
                            } else {
                                res.status(400).send({ error: 'Error de registro.' });
                            }
                        });
                    } else {
                        res.status(400).send({ error: 'Error de encriptación.' });
                    }
                });
            }
        });
    } else {
        res.status(400).send({ message: 'Debe ingresar todos los parámetros requeridos.' });
    }
}

function login(username, password, req, res) {
    var params = req.body;
    if (username) {
        if (password) {
            User.findOne({ $or: [{ username: username }, { email: username }] }, (err, found) => {
                if (err) {
                    res.status(500).send({ error: 'Error interno del servidor', err });
                } else if (found) {
                    bcrypt.compare(password, found.password, (err, accepted) => {
                        if (err) {
                            res.status(500).send({ error: 'Error interno del servidor.', err });
                        } else if (accepted) {
                            if (params.gettoken = true) {
                                res.send({ token: jwt.createToken(found) });
                            } else {
                                res.status(500).send({ message: 'Error al generar autenticación.' });
                            }
                        } else {
                            res.status(400).send({ message: 'Contraseña incorrecta.' });
                        }
                    });
                } else {
                    res.status(400).send({ message: 'Nombre de usuario o correo electrónico incorrecto.' });
                }
            });
        } else {
            res.status(400).send({ message: 'Ingrese su contraseña.' });
        }
    } else {
        res.status(400).send({ message: 'Ingrese su correo electrónico o nombre de usuario.' });
    }
}

function profile(username, req, res) {
    User.findOne({ username: username }, (err, found) => {
        if (err) {
            res.status(500).send({ error: 'Error interno del servidor.', err });
        } else if (found) {
            if (found.username == req.user.username) {
                res.status(200).send({
                    'Mi Perfil': found.username,
                    'Name': found.name,
                    'Email': found.email,
                    'Seguidores': found.followers.length,
                    'Siguiendo': found.following.length
                });
            } else {
                res.status(200).send({
                    'Perfil': found.username,
                    'Name': found.name,
                    'Email': found.email,
                    'Seguidores': found.followers.length,
                    'Siguiendo': found.following.length
                });
            }
        } else {
            res.status(404).send({ message: 'No hay datos para mostrar.' });
        }
    });
}

function add_tweet(content, req, res) {
    var tweet = new Tweet;
    var userId = req.user.sub;

    if (content) {
        User.findById(userId, (err, found) => {
            if (err) {
                res.status(500).send({ error: 'Error interno del servidor', errr });
            } else if (found) {
                tweet.author = found.username;
                tweet.content = content;
                tweet.date = new Date();

                tweet.save((err, saved) => {
                    if (err) {
                        res.status(500).send({ error: 'Error interno del servidor.', err });
                    } else if (saved) {
                        User.findByIdAndUpdate(userId, { $push: { tweets: saved._id } }, (err, updated) => {
                            if (err) {
                                res.status(500).send({ error: 'Error interno del servidor.', err });
                            } else if (updated) {
                                res.send({ 'Tweet agregado': saved });
                            } else {
                                res.status(400).send({ message: 'Error al agregar tweet al usuario.' });
                            }
                        });
                    } else {
                        res.status(400).send({ message: 'Error al generar el tweet.' });
                    }
                });
            } else {
                res.status(418).send({ message: 'Error al buscar el usuario.' });
            }
        });
    } else {
        res.status(404).send({ message: 'Debe ingresar el contenido del tweet.' });
    }
}

function delete_tweet(idT, req, res) {
    var userId = req.user.sub;

    Tweet.findById(idT, (err, found) => {
        if (err) {
            res.status(500).send({ error: 'Error interno del servidor.', err });
        } else if (found) {
            if (req.user.username != found.author) {
                res.status(400).send({ message: 'No tiene permitido realizar esta acción.' });
            } else {
                Tweet.findByIdAndDelete(idT, (err, deleted) => {
                    if (err) {
                        res.status(500).send({ error: 'Error interno del servidor.', err });
                    } else if (deleted) {
                        User.findByIdAndUpdate(userId, { $pull: { tweets: deleted._id } }, { new: true }, (err, updated) => {
                            if (err) {
                                res.status(500).send({ error: 'Error interno del servidor.', err });
                            } else if (updated) {
                                res.send({ message: 'Tweet eliminado exitosamente.' });
                            } else {
                                res.status(418).send({ error: 'Error al actualizar lista de tweets.' });
                            }
                        });
                    } else {
                        res.status(418).send({ error: 'Error al eliminar el tweet.' });
                    }
                });
            }
        } else {
            res.status(404).send({ message: 'El tweet que busca no existe.' });
        }
    });
}

function edit_tweet(idT, newContent, req, res) {
    if (newContent) {
        Tweet.findById(idT, (err, found) => {
            if (err) {
                res.status(500).send({ error: 'Error interno del servidor.', err });
            } else if (found) {
                if (found.author != req.user.username) {
                    res.status(400).send({ message: 'No tiene permitido realizar esta acción.' });
                } else {
                    Tweet.findByIdAndUpdate(idT, { content: newContent, date: new Date() }, { new: true }, (err, updated) => {
                        if (err) {
                            res.status(500).send({ error: 'Error interno del servidor.', err });
                        } else if (updated) {
                            res.send({ 'Tweet actualizado': updated });
                        } else {
                            res.status(418).send({ error: 'Error al editar el tweet.' });
                        }
                    });
                }
            } else {
                res.status(404).send({ error: 'El tweet que intenta editar no existe.' });
            }
        });
    } else {
        res.status(400).send({ message: 'Debe ingresar el contenido nuevo del tweet.' });
    }
}

function view_tweets(username, res) {
    if (username) {
        User.findOne({ username: username }, (err, found) => {
            if (err) {
                res.status(500).send({ error: 'Error interno del servidor.', err });
            } else if (found) {
                res.status(200).send({ 'Tweets': found.tweets });
            } else {
                res.status(404).send({ message: 'No hay datos para mostrar.' });
            }
        }).populate({ path: 'tweets', select: '-__v', options: { sort: { 'date': -1 } } });
    } else {
        res.status(400).send({ message: 'Ingrese el usuario del perfil que desea ver.' });
    }
}

function follow(username, req, res) {

    if (username) {
        if (username == req.user.username) {
            res.status(400).send({ message: 'No puede seguirse usted mismo.' });
        } else {
            User.findOne({ username: username }, (err, found) => {
                if (err) {
                    res.status(500).send({ error: 'Error interno del servidor.', err });
                } else if (found != null) {
                    User.findOne({ username: req.user.username, following: found._id }, (err, alreadyFollowed) => {
                        if (err) {
                            res.status(500).send({ error: 'Error interno del servidor.', err });
                        } else if (alreadyFollowed) {
                            res.status(400).send({ message: 'Ya sigues a este usuario.' });
                        } else {
                            User.findByIdAndUpdate(found._id, { $push: { followers: req.user.sub } }, (err, found) => {
                                if (err) {
                                    res.status(500).send({ error: 'Error interno del servidor', err });
                                } else if (found) {
                                    User.findByIdAndUpdate(req.user.sub, { $push: { following: found._id } }, { new: true }, (err, updated) => {
                                        if (err) {
                                            res.status(500).send({ error: 'Error interno del servidor.', err });
                                        } else if (updated) {
                                            res.send({ message: '¡Ahora sigues a este usuario!' });
                                        } else {
                                            res.status(404).send({ message: 'Error al actualizar perfil.' });
                                        }
                                    });
                                } else {
                                    res.status(404).send({ error: 'Error al actualizar lista de seguidores.' });
                                }
                            });
                        }
                    });
                } else {
                    res.status(400).send({ message: 'El usuario ingresado no existe, intente con otro.' });
                }
            });
        }
    } else {
        res.status(400).send({ message: 'Ingrese el nombre de usuario que desea seguir.' });
    }
}

function unfollow(username, req, res) {
    if (username) {
        if (username == req.user.username) {
            res.status(400).send({ message: 'No puede dejar de seguirse usted mismo.' });
        } else {
            User.findOne({ username: username }, (err, found) => {
                if (err) {
                    res.status(500).send({ error: 'Error interno del servidor.', err });
                } else if (found != null) {
                    User.findOne({ username: req.user.username, following: found._id }, (err, following) => {
                        if (err) {
                            res.status(500).send({ error: 'Error interno del servidor.', err });
                        } else if (following) {
                            User.findByIdAndUpdate(found._id, { $pull: { followers: req.user.sub } }, (err, found) => {
                                if (err) {
                                    res.status(500).send({ error: 'Error interno del servidor', err });
                                } else if (found) {
                                    User.findByIdAndUpdate(req.user.sub, { $pull: { following: found._id } }, { new: true }, (err, updated) => {
                                        if (err) {
                                            res.status(500).send({ error: 'Error interno del servidor.', err });
                                        } else if (updated) {
                                            res.send({ message: 'Has dejado de seguir a este usuario.' });
                                        } else {
                                            res.status(404).send({ message: 'Error al actualizar perfil.' });
                                        }
                                    });
                                } else {
                                    res.status(404).send({ error: 'Error al actualizar lista de seguidores.' });
                                }
                            });
                        } else {
                            res.status(400).send({ message: 'Aún no sigues a este usuario.' });
                        }
                    });
                } else {
                    res.status(400).send({ message: 'El usuario ingresado no existe, intente con otro.' });
                }
            });
        }
    } else {
        res.status(400).send({ message: 'Ingrese el nombre de usuario que desea dejar de seguir.' });
    }
}

module.exports = {
    comands,
    getComand
}