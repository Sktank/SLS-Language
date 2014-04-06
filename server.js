
// =========================================================
//                        Imports
// =========================================================

var express = require('express'),
    jade     = require('jade'),
    http     = require('http'),
    random   = require("node-random"),
    swig     = require('swig'),
    request  = require('request'),
    mongoose = require('mongoose'),
    RBTree   = require('bintrees').RBTree,
    passport = require('passport'),
    flash 	 = require('connect-flash'),
    configDB = require('./config/database.js');
//    port     = process.env.PORT || 8080;

mongoose.connect(configDB.url);

require('./config/passport')(passport); // pass passport for configuration

var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

var googleApiKey = 'AIzaSyDyYwY9iZG8Jr2uv_6aRscKqybfYwN9S2E';
var maxValue = 9007199254740992;
var SPEED = .0025; // grows 25 points in 5 seconds

// =========================================================
//                        Config
// =========================================================

app.configure(function() {
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.set('view engine', 'html');
    app.engine('html', swig.renderFile);

    app.set('views', __dirname + '/views');
    app.set("view options", { layout: false });
    app.use(express.static(__dirname + '/public'));

    app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session
});

server.listen(3000);

require('./app/routes.js')(app, passport);


// =========================================================
//                        Routing
// =========================================================

languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Japanese', 'Arabic'];



// =========================================================
//                        Mongoose
// =========================================================

//var db = mongoose.connection;
//db.on('error', console.error.bind(console, 'connection error:'));
//db.once('open', function callback () {
//    console.log("open");
//    var userSchema = mongoose.Schema({
//        name: String
//    });
//    var User = mongoose.model('User', userSchema);
//
//    var user1 = new User({ name: 'spencer' });
//
////    user1.save(function (err, user) {
////        if (err) return console.error(err);
////    });
//});

// =========================================================
//                        Sockets
// =========================================================

var levelMap = {
    "beginner": 25,
    "intermediate": 50,
    "advanced": 75,
    "native": 100
};

io.sockets.on('connection', function (socket) {

    // add user to language queue
    console.log('socket: ' + socket);

    //
    socket.on('setChatRoom', function(language, level, matchNative) {
        var score = levelMap[level];
        socket.language = language;
        socket.score = score;
        socket.time = new Date().getTime();
        socket.nonce = Math.floor(Math.random()*maxValue) + 1;
        socket.matched = false;
        socket.queued = false;
        socket.chatLanguage = chatMap[socket.language];
        socket.tree = socket.chatLanguage.tree;
        socket.connected = true;


        if (level === "native") {
            queueNativeUser(socket);
        }
        else {
            queueUser(socket);
        }

        if (matchNative && level != "native") {
            console.log("match native is set to true");
            queueNativeSeekingUser(socket);
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
            updateTimersAfterRemove(socket);
        }

        socket.connected = false;
        socket.queued = false;
        socket.matched = false;
    })
});

// =========================================================
//                     Language Matchmaking
// =========================================================


// TODO: Not quite sure if this function works. Need to do some tests to verify
function updateTimersAfterRemove(first, second) {
    var first = first,
        second = second;

    if (!second) {
        second = first;
    }
    var it = first.tree.upperBound(first);
    var prev = it.prev();
    it = first.tree.lowerBound(second);
    var next = it.next();
    if (prev) {
        clearTimeout(prev.timer);
    }
    if (prev && next) {
        updateTimer(prev, next);
    }
}

function LanguageChat(language) {
    this.numRooms = 0;
    this.nativeQueue = new Queue();
    this.seekingNativeQueue = new Queue();
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

function queueNativeUser(socket) {
    var chat = chatMap[socket.language];
    chat.nativeQueue.enqueue(socket);
    socket.nativeQueue = chat.nativeQueue;
    socket.queued = true;
//    createNativeMatch(chat);
    tryNativeMatch(chat);
}

function queueNativeSeekingUser(socket) {
    var chat = chatMap[socket.language];
    chat.seekingNativeQueue.enqueue(socket);
    socket.seekingNativeQueue = chat.seekingNativeQueue;
    socket.queued = true;
    tryNativeMatch(chat);
}

function tryNativeMatch(chat) {

    console.log("trying native match");
    console.log("native before: " + chat.nativeQueue.length);
    console.log("nonnative before: " + chat.seekingNativeQueue.length);
    while (chat.seekingNativeQueue.length > 0 && (chat.seekingNativeQueue.head.value.matched == true || chat.seekingNativeQueue.head.value.connected == false)) {
        chat.seekingNativeQueue.dequeue();
    }

    while (chat.nativeQueue.length > 0 && chat.nativeQueue.head.value.connected == false) {
        chat.nativeQueue.dequeue();
    }
    console.log("native after: " + chat.nativeQueue.length);
    console.log("nonnative after: " + chat.seekingNativeQueue.length);
    console.log();
    console.log("im creating a match");

    if (chat.nativeQueue.length > 0 && chat.seekingNativeQueue.length > 0) {
        console.log("im actually creating a match");
        var room = chat.language + '-' + chat.numRooms;
        chat.numRooms = chat.numRooms + 1;
        var nativeUser = chat.nativeQueue.dequeue(),
            nonNativeUser = chat.seekingNativeQueue.dequeue();

        console.log("____________________________");
        console.log("matched nonnative is: " + nonNativeUser.score);
        console.log("____________________________");
        nativeUser.join(room);
        nonNativeUser.join(room);
        nativeUser.room = room;
        nonNativeUser.room = room;
        delete nativeUser.nativeQueue;
        delete nonNativeUser.seekingNativeQueue;
        nonNativeUser.queued = false;
        nativeUser.queued = false;

        nonNativeUser.tree.remove(nonNativeUser);
        nonNativeUser.matched = true;
        // update timers
        updateTimersAfterRemove(nonNativeUser);

        io.sockets.in(room).emit('start', room);
        return true;
    }
    else {
        return false;
    }
}

function queueUser(socket) {
//    lang.Queues[level].push(socket);
    socket.tree.insert(socket);
    socket.queued = true;
    createTreeMatch(socket.tree, socket);
}

function createTreeMatch(tree, socket) {
    var tit=tree.iterator(), item;
    console.log("=========entire=========");
    while((item = tit.next()) !== null) {
        console.log(item.score + "," + item.time);
    }
//    console.log("========upperbound=========");
//    console.log("current score is: " + socket.score);
    var it = tree.lowerBound(socket);
    var next = it.next();
    console.log(next);
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
    console.log("current score is: " + current.score);
    console.log("next score is: " + next.score);
    console.log("score diff is: " + (next.score - current.score));
    console.log("time is: " + SPEED * (current.time - next.time));
    console.log("numerator is: " + ((next.score - current.score) - Math.abs(SPEED * (current.time - next.time))));
    console.log("denominator is: " + (2 * SPEED));
    var timeDiff = ((next.score - current.score) - Math.abs(SPEED * (current.time - next.time))) / (2 * SPEED);
    console.log(timeDiff);
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
    if (!current.matched && !next.matched && current.queued && next.queued) {
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
    updateTimersAfterRemove(current, next);

    //remove nodes from tree
    var tree = current.tree;
    tree.remove(current);
    tree.remove(next);
    current.queued = false;
    next.queued = false;
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


// =========================================================
//                Queue Implementation
// =========================================================

function QueueNode(object) {
    this.next = null;
    this.value = object;
}

function Queue() {
    var self = this;
    this.tail = null;
    this.head = null;
    this.length = 0;

    this.enqueue = function(object) {
        var newNode = new QueueNode(object);
        if (self.length > 0) {
            self.tail.next = newNode;
        }
        else {
            self.head = newNode;
        }
        self.tail = newNode;
        self.length = this.length + 1;
        return true;
    };

    this.dequeue = function() {
//        console.log(self.length);
        if (self.length > 0) {
            var ret = self.head.value;
            self.head = self.head.next;
            self.length = self.length - 1;
            return ret;
        }
        return null;
    };
}

var ku = new Queue();
console.log(ku.dequeue());
ku.enqueue(5);
ku.enqueue(6);
ku.enqueue(7);
console.log(ku.dequeue());
ku.enqueue(8);
console.log(ku.dequeue());
console.log(ku.dequeue());
console.log(ku.dequeue());

