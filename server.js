
// =========================================================
//                        Imports
// =========================================================

var express = require('express'),
    chat = require('./chat'),
    jade = require('jade'),
    http = require('http'),
    random = require("node-random"),
    swig = require('swig'),
    request = require('request'),
    mongoose = require('mongoose'),
    RBTree = require('bintrees').RBTree;

mongoose.connect('mongodb://localhost/test');


var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);
server.listen(3000);

var googleApiKey = 'AIzaSyDyYwY9iZG8Jr2uv_6aRscKqybfYwN9S2E';
var maxValue = 9007199254740992;
var SPEED = .0025; // grows 25 points in 5 seconds

// =========================================================
//                        Config
// =========================================================

app.set('views', __dirname + '/views');
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set("view options", { layout: false });
app.use(express.static(__dirname + '/public'));

// =========================================================
//                        Routing
// =========================================================

languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Japanese', 'Arabic'];

app.get('/', function (req, res) {
   res.render(
       'home.html', {languages:languages}
   );
});

app.get('/chat/:language/:level', chat.enter);


// =========================================================
//                        Mongoose
// =========================================================

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log("open");
    var userSchema = mongoose.Schema({
        name: String
    })
    var User = mongoose.model('User', userSchema);

    var user1 = new User({ name: 'spencer' });

//    user1.save(function (err, user) {
//        if (err) return console.error(err);
//    });
});

// =========================================================
//                        Sockets
// =========================================================

var levelMap = {
    "beginner": 25,
    "intermediate": 50,
    "advanced": 75
};

io.sockets.on('connection', function (socket) {

    // add user to language queue
    console.log('socket: ' + socket);

    //
    socket.on('setChatRoom', function(language, level) {
        var score = levelMap[level];
        socket.language = language;
        socket.score = score;
        socket.time = new Date().getTime();
        socket.nonce = Math.floor(Math.random()*maxValue) + 1;
        socket.matched = false;
        socket.chatLanguage = chatMap[socket.language];
        queueUser(socket);
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
//                detectLanguage(socket, data);
////                }
//            }
//        });

    });

    socket.on('disconnect', function() {
        if (socket.room) {
            socket.broadcast.to(socket.room).emit('end');

            var roster = io.sockets.clients(socket.room);
            roster.forEach(function(client) {
                client.leave(socket.room);
            });
        }

        if (socket.tree) {
            console.log(socket.tree);
            socket.tree.remove(socket);

            // update timers
            updateTimersFromRemove(socket, socket);


        }

    })
});

// =========================================================
//                     Language Matchmaking
// =========================================================

function updateTimersFromRemove(first, second) {
    var it = first.tree.upperBound(first);
    var prev = it.prev();
    it = first.tree.lowerBound(second);
    var next = it.data();
    if (prev) {
        clearInterval(prev.timer);
    }
    if (prev && next) {
        updateTimer(prev, next);
    }
}

function LanguageChat(language) {
    this.numRooms = 0;
    this.Queues = {
        beginner:[],
        intermediate:[],
        advanced:[],
        native:[]
    };
    this.tree = new RBTree(function(a, b) {
        if(Object.is(a, b)) {
            return 0;
        }
        if (a && b) {
            var comp = a.score - b.score;
            if (comp == 0) {
                var timeDiff = b.time - a.time;
                if (timeDiff != 0) {
                    return timeDiff;
                }
                else {
                    return a.nonce - b.nonce;
                }
            }
            else {
                return comp;
            }
        }
        else {
            return 1;
        }
    });
    this.language = language;
}


// definition of of global chat room queues
var englishChat = new LanguageChat('english'),
    spanishChat = new LanguageChat('spanish'),
    frenchChat = new LanguageChat('french'),
    germanChat = new LanguageChat('german'),
    italianChat = new LanguageChat('italian'),
    chineseChat = new LanguageChat('chinese'),
    japaneseChat = new LanguageChat('japanese'),
    arabicChat = new LanguageChat('arabic');

var chatMap = {
    english: englishChat,
    spanish: spanishChat,
    french: frenchChat,
    german: germanChat,
    italian: italianChat,
    chinese: chineseChat,
    japanese: japaneseChat,
    arabic: arabicChat
};

function queueUser(socket) {
//    lang.Queues[level].push(socket);
    socket.tree = socket.chatLanguage.tree;
    socket.tree.insert(socket);
    createTreeMatch(socket.tree, socket);
}

function createTreeMatch(tree, socket) {
//    var tit=tree.iterator(), item;
//    console.log("=========entire=========");
//    while((item = tit.next()) !== null) {
//        console.log(item.score + "," + item.time);
//    }
//    console.log("========upperbound=========");
//    console.log("current score is: " + socket.score);
    var it = tree.upperBound(socket);
    var next = it.data();
    var timeDiff;

    if (next) {

        // set timer for next
        updateTimer(socket, next);

    }

    // fix previous timer
    var lit = tree.lowerBound(socket);
    var prev = lit.prev();
    if (prev) {
        console.log("the previous thinggy is, " + prev.score + "," + prev.time);
        clearTimeout(prev.timer);
        updateTimer(prev, socket);
    }
}

function updateTimer(current, next) {
    var timeDiff = ((next.score - current.score)  - (SPEED * (current.time - next.time))) / (2 * SPEED);
    if (timeDiff < 0) timeDiff = 0;
    current.timer = setTimeout(function() {
        checkAndMatch(current, next);
    }, timeDiff);
}

function checkAndMatch(current, next) {

    // set up room
    var room = current.language + '-' + current.chatLanguage.numRooms;
    current.chatLanguage.numRooms = current.chatLanguage.numRooms + 1;

    //check if already been matched
    if (!current.matched && !next.matched) {
        current.matched = true;
        next.matched = true;
    }
    else {
        console.log("shit happened, fuck");
        return null;
    }

    // put match in its own room
    current.join(room);
    next.join(room);
    current.room = room;
    next.room = room;
    io.sockets.in(room).emit('start', room);

    // update tree

    // update timers
    updateTimersFromRemove(current, next);

    //remove nodes from tree
    var tree = current.tree;
    tree.remove(current);
    tree.remove(next);
    delete current.tree;
    delete next.tree;

}



// =========================================================
//                Google Translate Utilities
// =========================================================

var languageCodes = {
    "en": "english",
    "es": "spanish",
    "fr": "french",
    "de": "german",
    "it": "italian",
    "zh-CN": "chinese",
    "ja": "japanese",
    "ar": "arabic"
};

function detectLanguage(socket, message) {
    request('https://www.googleapis.com/language/translate/v2/detect?key=' + googleApiKey + '&q=' + message, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body); // Print the lookup
            var info = eval("value = (" + body + ")");
            var result = info.data.detections[0][0];
            var detectedLanguage = languageCodes[result.language];
            console.log(result);
            if (detectedLanguage != socket.language && result.language != "null" && result.language != "und" && result.confidence > 0.8) {
                if (detectedLanguage) {
                    socket.emit('languageWarning', detectedLanguage)
                }
                else {
                    socket.emit('languageWarning', result.language)
                }
            }

        }
    });
}