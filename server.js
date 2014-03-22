
// =========================================================
//                        Imports
// =========================================================

var express = require('express'),
    chat = require('./chat'),
    jade = require('jade'),
    http = require('http'),
    random = require("node-random"),
    request = require('request');


var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);
server.listen(3000);

var googleApiKey = 'AIzaSyDyYwY9iZG8Jr2uv_6aRscKqybfYwN9S2E'

// =========================================================
//                        Config
// =========================================================

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false });
app.use(express.static(__dirname + '/public'));

// =========================================================
//                        Routing
// =========================================================

app.get('/', function (req, res) {
   res.render(
       'home.jade'
   );
});

app.get('/chat/:language', chat.enter);

// =========================================================
//                        Sockets
// =========================================================

io.sockets.on('connection', function (socket) {

    // add user to language queue
    console.log('socket: ' + socket);

    //
    socket.on('setLanguage', function(language) {
        queueUser(this, language);
        console.log(language);
        socket.language = language
    });

    socket.on('message', function (message) {
        var room = message.room;
        var data = message.data;
        socket.broadcast.to(room).emit('message', data);

        // randomly check if message is in the correct language
        random.numbers({
            "number": 1,
            "minimum": 1,
            "maximum": 10
        }, function(error, number) {
            if (!error) {
                if (number[0] == 10) {
                    console.log(data[0]);
                    detectLanguage(socket, data);
                }
            }
        });

    });

    socket.on('disconnect', function() {
        if (socket.room) {
            socket.broadcast.to(socket.room).emit('end');

            var roster = io.sockets.clients(socket.room);
            roster.forEach(function(client) {
                client.leave(socket.room);
            });
        }

        if (socket.Queue) {
            console.log(socket.Queue);
            var index = socket.Queue.indexOf(socket);
            if (index > -1) {
                socket.Queue.splice(index, 1);
            }
        }

        if (socket.language) {
            delete socket.language;
        }

    })
});

// =========================================================
//                     Language Matchmaking
// =========================================================

function LanguageChat(language) {
    this.numRooms = 0;
    this.Queue = [];
    this.language = language;
}

var englishChat = new LanguageChat('english');
var spanishChat = new LanguageChat('spanish');
var frenchChat = new LanguageChat('french');

var chatMap = {
    english: englishChat,
    spanish: spanishChat,
    french: frenchChat
};

function queueUser(socket, language) {
    var chat = chatMap[language];
    chat.Queue.push(socket);
    socket.Queue = chat.Queue;
    createMatch(chat);
}

function createMatch(chat) {
    var queue = chat.Queue;
    console.log('length = ' + queue.length);
    console.log(queue);
    if (queue.length > 1) {
        var room = chat.language + '-' + chat.numRooms;
        chat.numRooms = chat.numRooms + 1;
        var user1 = queue.pop(),
            user2 = queue.pop();
        user1.join(room);
        user2.join(room);
        user1.room = room;
        user2.room = room;
        delete user1.Queue;
        delete user2.Queue;
        io.sockets.in(room).emit('start', room);
        return true;
    }
    else {
        return false;
    }
}

// =========================================================
//                Google Translate Utilities
// =========================================================

var languageCodes = {
    "en": "english",
    "es": "spanish",
    "fr": "french"
};

function detectLanguage(socket, message) {
    request('https://www.googleapis.com/language/translate/v2/detect?key=' + googleApiKey + '&q=' + message, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body); // Print the lookup
            var info = eval("value = (" + body + ")");
            var result = info.data.detections[0][0];
            var detectedLanguage = languageCodes[result.language];
            if (detectedLanguage != socket.language && detectedLanguage != "null" && result.confidence > 0.5) {
                socket.emit('languageWarning', detectedLanguage)
            }

        }
    });
}