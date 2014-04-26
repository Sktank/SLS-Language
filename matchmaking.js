/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/6/14
 * Time: 4:59 PM
 * To change this template use File | Settings | File Templates.
 */


// =========================================================
//                     Language Matchmaking
// =========================================================

var queue       = require('./queue.js'),
    websockets  = require('./server.js'),
    RBTree   = require('bintrees').RBTree;

var SPEED = .0025; // grows 25 points in 5 seconds

var topics =
{
    'Weather': {
        'translations': {'english':'Weather', 'spanish':"Tiempo"},
        'words': {
            'english': ['rain', 'wind', 'hot', 'cold', 'clouds', 'snow'],
            'spanish': ['lluvia', 'viento', 'calor', 'frio', 'nubes', 'nieve']
        }
    },
    'Food': {
        'translations': {'english':'Food', 'spanish':"Comida"},
        'words': {
            'english': ['bread', 'cheese'],
            'spanish': ['pan', 'queso']
        }
    }
};


// TODO: Not quite sure if this function works. Need to do some tests to verify
exports.updateTimersAfterRemove = function(first, second) {
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
};

function LanguageChat(language) {
    this.numRooms = 0;
    this.nativeQueue = new queue.Queue();
    this.seekingNativeQueue = new queue.Queue();
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

exports.chatMap = {
    english: englishChat,
    spanish: spanishChat,
    french: frenchChat,
    german: germanChat,
    italian: italianChat,
    chinese: chineseChat,
    japanese: japaneseChat,
    arabic: arabicChat
};

exports.queueNativeUser = function(socket) {
    var chat = exports.chatMap[socket.language];
    chat.nativeQueue.enqueue(socket);
    socket.nativeQueue = chat.nativeQueue;
    socket.queued = true;
//    createNativeMatch(chat);
    tryNativeMatch(chat);
}

exports.queueNativeSeekingUser = function(socket) {
    var chat = exports.chatMap[socket.language];
    chat.seekingNativeQueue.enqueue(socket);
    socket.seekingNativeQueue = chat.seekingNativeQueue;
    socket.queued = true;
    tryNativeMatch(chat);
};

function getTopicInfo(topic, nativeLanguage, chatLanguage) {
    var topicData = topics[topic];
    var topicInfo = {'native':{topic:'', words:[]}, 'chat': {topic:'', words:[]}};

    //set up native translations
    topicInfo.native.topic = topicData.translations[nativeLanguage];
    topicInfo.native.words = topicData.words[nativeLanguage];

    //set up chat translations
    topicInfo.chat.topic = topicData.translations[chatLanguage];
    topicInfo.chat.words = topicData.words[chatLanguage];

    console.log(topicInfo);
    return topicInfo

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
        exports.updateTimersAfterRemove(nonNativeUser);

        //set up guids for rating
        nonNativeUser.partnerGuid = nativeUser.guid;
        nativeUser.partnerGuid = nonNativeUser.guid;
        var reviews = true;

        if (nonNativeUser.guid == nativeUser.guid) {
            reviews = false;
        }

        //compose the topic infos
        var topic = 'Weather';
        var topicInfo = getTopicInfo(topic, 'english', 'spanish');

        websockets.io.sockets.in(room).emit('start', room, reviews, topicInfo);
        return true;
    }
    else {
        return false;
    }
}

exports.queueUser = function(socket) {
//    lang.Queues[level].push(socket);
    socket.tree.insert(socket);
    socket.queued = true;
    createTreeMatch(socket.tree, socket);
};

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


    //set up guids for rating
    current.partnerGuid = next.guid;
    next.partnerGuid = current.guid;
    var reviews = true;

    if (current.guid == next.guid) {
        reviews = false;
    }

    //compose the topic infos
    var topic = 'Weather';
    var topicInfo = getTopicInfo(topic, 'english', 'spanish');

    websockets.io.sockets.in(room).emit('start', room, reviews, topicInfo);

    // update tree

    // update timers
    exports.updateTimersAfterRemove(current, next);

    //remove nodes from tree
    var tree = current.tree;
    tree.remove(current);
    tree.remove(next);
    current.queued = false;
    next.queued = false;
    delete current.tree;
    delete next.tree;

}
