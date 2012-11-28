/*
    Node.js application config / setup file
    for We Should Eat Web application
*/

// Dependencies and intial application creation
var express     = require('express'),
    app         = express(),
    server      = require('http').createServer(app),
    io          = require('socket.io').listen(server),
    twit        = require('twit'),
    redis       = require('redis'),
    priv        = require('./config'),
    oauth       = require('oauth'),
    storage     = redis.createClient(),
    publish     = redis.createClient(),
    subscribe   = redis.createClient();

var url = 'http://weshouldeat.com/';
//var url = 'http://localhost/'
// Connected to redis instances
/*storage.auth('b4d450df9b26486f8b19ddc4c5e8c049'),
publish.auth('b4d450df9b26486f8b19ddc4c5e8c049'),
subscribe.auth('b4d450df9b26486f8b19ddc4c5e8c049');*/

app.configure(function() {
    app.set('port', process.env.PORT || 80 );
    app.use(express.logger('dev'));
    app.use(express.bodyParser()); // Process HTTP headers
    app.use(express.methodOverride());
    app.use(express.cookieParser()); 
    app.use(express.session({ secret: 'hash something' })); // Setup sessions for auth TODO: setup session store with redis
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.locals({ // TODO: site github gist for this hack to work with sessions
    session: function(req, res) {
        return req.session;
    }
});

/* Twitter consumer function */

var consumer = function() {
    return new oauth.OAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        priv.consumerKey,
        priv.consumerSecret,
        '1.0A',
        url + 'api/auth/callback',
        'HMAC-SHA1'
    );
}

/*
    Redis functions listing NOTICE: githubbers reading this code,
    I wanted to learn everything I could about redis and get past
    the areas I would see mongoDB a better fit. For lots of this
    stuff I would recommend using another solution like mongo for
    the users table/objects
*/

// Save functions
var save = {
    /* Users */
    userSetAdd: function(uid) {
        storage.sadd('users', 'user:' + uid);
    },
    userHashSet: function(uid, usrObject) {
        storage.hmset('user:' + uid, usrObject);
    },
    /* Suggestions */
    suggestionSetAdd: function(room, placeObject) {
        storage.sadd(room + '.suggestions', room + '.suggestion.' + placeObject['uid']);
        save.suggestionHashAdd(room, placeObject);
    },
    suggestionHashAdd: function(room, placeObject) {
        storage.hmset(room + '.suggestion.' + placeObject['uid'], placeObject);
    },
    /* Votes */
    singleVote: function(room, place, uid) {
        storage.hgetall(room + ':votes', function(err, votes) {
            if ( votes != null ) {
                if ( typeof votes[place] != 'undefined' ) { // Make sure place exists already
                    // Make sure user hasnt voted on this already
                    if ( votes[place].indexOf(uid) === -1 ) {
                        votes[place] = votes[place] + ':' + uid;
                    }
                } else {
                    votes[place] = uid;
                }

                storage.hmset(room + ':votes', votes);
            } else { // Setup voting for this room
                var placeObject = {}
                placeObject[place] = uid;
                storage.hmset(room + ':votes', placeObject);
            }
        });
        // Get most popular place now
        get.popularVote(room, function(winner) {
            io.sockets.in(room).emit('updateMostVoted', winner);
        });
    },
    /* Rooms */
    room: function(room) {
        storage.sadd('main.rooms', room);
    },
}

// Get functions
var get = {
    /* Users */
    allUsers: function(callback) {
        storage.smembers('users', callback);
    },
    userHash: function(uid, callback) {
        storage.hgetall('user:' + uid, callback);
    },
    /* Suggestions */
    allSuggestions: function(room, callback) {
        storage.smembers(room + '.suggestions', function(err, suggestions) {
            for ( var i=0; i<suggestions.length; i++ ) {
                get.suggestionHash(suggestions[i], function(err, reply) {
                    io.sockets.in(room).emit('sendSuggestion', reply);
                });
            }
            return callback();
        });
    },
    suggestionHash: function(id, callback) {
        storage.hgetall(id, callback);
    },
    /* Votes */
    popularVote: function(room, callback) {
        storage.hgetall(room + ':votes', function(err, votes) {
            var popular = [];
            if ( votes != null ) {
                for ( var place in votes ) {
                    var total = votes[place].split(':');
                    var count = total.length; // Count total votes
                    if ( typeof popular[1] != 'undefined' ) { // If there already was a winner
                        if ( popular[1] < count ) {
                            popular = [ place, count ];
                        }
                    } else { // If nothing voted on yet, set winner
                        popular = [ place, count ];
                    }
                }
            }
            return callback(popular);
        });
    },
    /* Rooms */
    rooms: function(callback) {
        helper.filterRooms(function() {
            storage.smembers('main.rooms', function(err, rooms) {
                return callback(rooms);
            });
        });
    }
}

// Helper functions
var helper = {
    filterRooms: function(callback) {
        storage.smembers('main.rooms', function(err, rooms) {
            for ( var i = 0; i<rooms.length; i++ ) {
                if ( io.sockets.clients(rooms[i]).length === 0 ) {
                    helper.removeRoom(rooms[i]);
                }
            }
            return callback();
        });
    },
    removeRoom: function(room) {
        storage.srem('main.rooms', room);
    },
    verifyAuth: function(req, res, next) {
        if ( req.session.oauthAccessToken ) {
            next();
        } else {
            res.redirect('/api/auth');
        }
    }
}

/* API back end routes */

// Authenticate with Twitter
app.get('/api/auth', function(req, res) {
    consumer().getOAuthRequestToken(function(err, oauthToken, oauthTokenSecret, results) {
        if ( err ) throw err;
        req.session.oauthRequestToken       = oauthToken;
        req.session.oauthRequestTokenSecret = oauthTokenSecret;
        res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + req.session.oauthRequestToken);
    });
});

// Twitter Auth Callback
app.get('/api/auth/callback', function(req, res) {
    consumer().getOAuthAccessToken(
        req.session.oauthRequestToken,
        req.session.oauthRequestTokenSecret,
        req.query.oauth_verifier,
        function(err, oauthAccessToken, oauthAccessTokenSecret, results) {
            if ( err ) throw err;
            req.session.oauthAccessToken = oauthAccessToken;
            req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
            req.session.oauthUserId = results['user_id']; // add the user id into session for easy access later
            // Now that we're authenticated, lets setup twit to make some API calls
            var T = new twit({
                consumer_key: priv.consumerKey,
                consumer_secret: priv.consumerSecret,
                access_token: req.session.oauthAccessToken,
                access_token_secret: req.session.oauthAccessTokenSecret
            });

            T.get('account/verify_credentials', function(err, reply) {
                var uid = reply['id_str'];

                get.userHash(uid, function(err, user) {
                    if ( user === null ) { // if user isn't in redis already
                        var usrObject = {
                            uid: reply['id_str'],
                            screen_name: reply['screen_name'],
                            real_name: reply['name'],
                            profile_image: reply['profile_image_url'],
                            background_color: reply['profile_background_color'],
                        }

                        save.userSetAdd(uid); // add them to the users set
                        save.userHashSet(uid, usrObject); // add them to their own user with user data
                    }
                });
            });
            res.redirect('/'); // once verified and auth'd, send back to index to see the app
        });
});

// Verify If Auth'd from the front end
// TODO: why are you only working with strings?
app.get('/api/auth/check', function(req, res) {
    if ( req.session.oauthAccessTokenSecret ) {
        res.send('true');
    } else {
        res.send('false');
    }
});

// Grab current user info from redis for front
app.get('/api/auth/current', function(req, res) {
    var uid = req.session.oauthUserId;
    get.userHash(uid, function(err, user) {
        if ( user != null ) {
            res.send(user);
        } else {
            res.send('User could not be found');
        }
    });
});

// Get user info from their uid
app.get('/api/users/:uid?', function(req, res) {
    var uid = req.params.uid;
    get.userHash(uid, function(err, user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(user));
        res.end();
    });
});

/*
    --Redis pub sub and socket.io--
    along with storing data in redis, the
    pub/sub model is also used for getting and
    displaying user actions
*/

subscribe.on('message', function(channel, message) {
    io.sockets.in(channel).emit('updateActions', message);
});

io.sockets.on('connection', function(socket) {
    // Init
    socket.on('init', function() {
        // Get list of dynamic rooms and send them to the client
        get.rooms(function(rooms) {
            socket.emit('listrooms', rooms);
        });
    });

    // Adding a room dynamically
    socket.on('addRoom', function(room) {
        save.room(room);
    });

    // When a user joins a room
    socket.on('joinRoom', function(room, user) {
        var name = user['real_name'];
        socket.room = room;
        socket.join(room);
        subscribe.subscribe(room);

        // Get the current suggested places for the new user joining
        storage.smembers(room + '.suggestions', function(err, suggestions) {
            for ( var i=0; i<suggestions.length; i++ ) {
                get.suggestionHash(suggestions[i], function(err, reply) {
                    socket.emit('sendSuggestion', reply);
                });
            }

            get.popularVote(room, function(winner) {
                socket.emit('updateMostVoted', winner);
            });
        });

        publish.publish(room, '<span data-user-id="'+ user['uid'] +'">'+ name +' has just joined.</span>');
    });

    // When a new place is suggested
    socket.on('placeSuggested', function(placeObject, room) {
        save.suggestionSetAdd(room, placeObject);
        save.singleVote(room, placeObject['name'], placeObject['uid']);
        publish.publish(room, '<span data-user-id="'+ placeObject['uid'] +'">'+ placeObject['name'] +' has been suggested by '+ placeObject['real_name'] +'</span>');
        io.sockets.in(room).emit('sendSuggestion', placeObject);
    });

    // When a vote has been recieved
    socket.on('voteSent', function(room, placeName, user) {
        save.singleVote(room, placeName, user['uid']);
        publish.publish(room, '<span data-user-id="'+user['uid']+'">'+ user['real_name'] +' has voted on '+ placeName +'</span>');
    });
});

server.listen(app.get('port'), function() {
    console.log('Node is up and running on port ' + app.get('port'));
});