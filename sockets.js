/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/6/14
 * Time: 4:58 PM
 * To change this template use File | Settings | File Templates.
 */


module.exports = function(server, io) {

// =========================================================
//                        Sockets
// =========================================================

    var levelMap = {
        "beginner": 25,
        "intermediate": 50,
        "advanced": 75,
        "native": 100
    };
    var maxValue = 9007199254740992;
    var matchmaking  = require('./matchmaking.js'),
        translations = require('./translate.js'),
        anonUser = require('./processUser.js'),
        ratings = require('./updateRatings.js');

    io.sockets.on('connection', function (socket) {

        // add user to language queue
        console.log('socket: ' + socket);

        //
        socket.on('setChatRoom', function(language, level, matchNative, guid) {
            var score = levelMap[level];
            socket.language = language;
            socket.score = score;
            socket.time = new Date().getTime();
            socket.nonce = Math.floor(Math.random()*maxValue) + 1;
            socket.matched = false;
            socket.queued = false;
            socket.chatLanguage = matchmaking.chatMap[socket.language];
            socket.tree = socket.chatLanguage.tree;
            socket.connected = true;
            socket.guid = guid;
            console.log(guid);

            //create the current profile or make a new one
            var anonProfile = anonUser.processUser(guid);
            //TODO: use profile to inform decision


            if (level === "native") {
                matchmaking.queueNativeUser(socket);
            }
            else {
                matchmaking.queueUser(socket);
            }

            if (matchNative && level != "native") {
                console.log("match native is set to true");
                matchmaking.queueNativeSeekingUser(socket);
            }
            else {
                console.log("match native is set to false");
            }
            console.log(language);
        });

        socket.on('message', function (message) {
            var room = message.room;
            var data = message.data;
            socket.broadcast.to(room).emit('message', data);


            //Google translate stuff

            // randomly check if message is in the correct language
//        console.log("lookup");
//        detectLanguage(socket, data);
//        random.numbers({
//            "number": 1,
//            "minimum": 1,
//            "maximum": 10
//        }, function(error, number) {
//            if (!error) {
////                if (number[0] == 10) {
//                console.log(data[0]);
//                translations.detectLanguage(socket, data);
////                }
//            }
//        });

        });

        socket.on('satReview', function(score, language) {
            ratings.update(socket.partnerGuid, score, language, 'numSatReviews', 'totalSatScore', 'numProfReviews', 'totalProfScore')
        });
        socket.on('profReview', function(score, language) {
            ratings.update(socket.partnerGuid, score, language, 'numProfReviews', 'totalProfScore', 'numSatReviews', 'totalSatScore')
        });


        socket.on('disconnect', function() {
            if (socket.room) {
                socket.broadcast.to(socket.room).emit('end');

                var roster = io.sockets.clients(socket.room);
                roster.forEach(function(client) {
                    client.leave(socket.room);
                    delete client.partnerGuid;
                });
            }

            if (socket.tree) {
                console.log(socket.tree);
                socket.tree.remove(socket);

                // update timers
                matchmaking.updateTimersAfterRemove(socket);
            }

            socket.connected = false;
            socket.queued = false;
            socket.matched = false;
        })
    });
};


