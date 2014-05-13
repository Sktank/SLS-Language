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

//var topics =
//{
//    'Weather': {
//        'translations': {'english':'Weather', 'spanish':"Tiempo"},
//        'words': {
//            'english': ['rain', 'wind', 'hot', 'cold', 'clouds', 'snow'],
//            'spanish': ['lluvia', 'viento', 'calor', 'frio', 'nubes', 'nieve']
//        }
//    },
//    'Food': {
//        'translations': {'english':'Food', 'spanish':"Comida"},
//        'words': {
//            'english': ['bread', 'cheese'],
//            'spanish': ['pan', 'queso']
//        }
//    }
//};

var topicList = ['Family', 'Countries', 'Food', 'Weather', 'Travel', 'Relationships', 'Housing', 'Entertainment', 'Professions', 'Study', 'Sport'];

var topics = {
    'Family': {
        'translations': {'english':'Family', 'spanish':'La familia'},
        'words' : {
            'english' : ['mother', 'father', 'son', 'daughter', 'brother', 'sister', 'grandmother', 'grandfather', 'cousin', 'niece'],
            'spanish': ['la madre', 'el padre', 'el hijo', 'la hija', 'el hermano', 'la hermana', 'la abuela', 'el abuelo', 'primo/a', 'sobrino/a']
        },
        'questions': {
            'english' : ['Talk about your family members'],
            'spanish': ['Hable sobre los miembros de su familia']
        },

        'phrases': {

            'english' : ["My mother's name is Linda"],
            'spanish': ['Mi madre se llama Linda']
        }
    },

    'Countries':{
        'translations': {'english':'Countries', 'spanish':'Los países'},
        'words' : {
            'english': ['United States', 'China', 'Japan', 'Germany', 'France', 'England', 'Spain', 'Mexico', 'Canada', 'Russia'],
            'spanish':['Los Estados Unidos', 'China', 'Japón', 'Alemania', 'Francia', 'Inglaterra', 'España', 'México', 'Canadá', 'Rusia']
        },
        'questions': {

            'english' : ['Where do you and your friends come from?'],
            'spanish': ['¿De dónde usted y sus amigos vienen?']
        },

        'phrases': {
            'english' : ["I'm from China"],
            'spanish': ['Soy de China']

        }
    },

    'Food':{
        'translations': {'english': 'Food', 'spanish': 'La Comida'},
            'words' : {
                'english' : ['lunch', 'dinner', 'dessert', 'breakfast', 'apple', 'orange','banana', 'meat', 'vegetable', 'fruit'],
                'spanish' : ['el almuerzo', 'la cena', 'el postre', 'el desayuno', 'la manzana', 'la naranja', 'el plátano', 'la carne', 'la verdura', 'la fruta']
            },
        'questions': {
            'english' : ['What is your favorite food?'],
            'spanish': ['¿Cuál es tu comida favorita?']
        },
        'phrases': {
            'english' : ['I like eating vegetables for dessert.'],
            'spanish': ['Me gusta comer verduras para el postre.']
        }
    },

    'Weather':{
        'translations': {'english': 'Weather', 'spanish': 'El Tiempo'},
            'words' : {
                'english' : ['sunny', 'rain', 'cloudy', 'thunderstorm', 'winter', 'summer','fall', 'spring', 'cold', 'warm'],
                'spanish' : ['soleado', 'la lluvia', 'nublado', 'la tormenta', 'el invierno', 'el verano', 'el otoño', 'la primavera', 'frío', 'caliente']
            },
        'questions': {
            'english' : ['What is the weather like today?'],
            'spanish': ['¿Qué tiempo hace hoy?']
        },
        'phrases': {
            'english' : ['Today is sunny but very cold.'],
            'spanish': ['Hoy es soleado pero muy frío.']
        }
    },

    'Travel':{
        'translations': {'english': 'Travel', 'spanish': 'Viajar'},
        'words' : {
            'english' : ['trip', 'car', 'bus', 'airplane', 'train', 'bicycle', 'hotel', 'hostel','vacations', 'passport'],
            'spanish' : ['la viaje', 'el coche', 'el bus', 'el avión', 'el tren', 'labicicleta', 'el hotel', 'el albergue', 'las vacaciones', 'el pasaporte']
        },
        'questions': {
            'english' : ['How do you get to work or to school?', 'Talk about a trip you enjoyed'],
            'spanish': ['¿Cómo tu llegas al trabajo o a la escuela?', 'Hable acerca de un viaje que te gustó']
        },
        'phrases': {
            'english' : ['I take the bus to go to school.'],
            'spanish': ['Yo tomo el autobús para ir a la escuela.']
        }
    },

    'Relationships':{
        'translations': {'english': 'Relationships', 'spanish': 'Las Relaciónes'},
            'words' : {
                'english' : ['girlfriend', 'boyfriend', 'fiancé', 'husband', 'wife', 'ex­boyfriend', 'go on a date', 'love at first sight', 'divorce', 'break­up'],
                'spanish' : ['la novia', 'el novio', 'prometido(a)', 'el esposo', 'la esposa', 'el ex­novio ',' ir a una cita', 'amor a primera vista', 'el divorcio', 'la separación']
            },
        'questions': {
            'english' : ['Talk about a relationship story'],
            'spanish': ['Hable acerca de una historia de una relación']
        },
        'phrases': {
            'english' : ['I went on a date with Mike and it was love at first sight. He is now my husband.'],
            'spanish': ['Fui a una cita con Mike y fue amor a primera vista. Él ahora es mi marido.']
        }
    },

    'Housing':{
        'translations': {'english': 'Housing', 'spanish': 'La Habitación'},
            'words' : {
                'english' : ['house', 'apartment', 'home', 'rental', 'location', 'bedroom','bathroom', 'kitchen', 'living room', '2nd floor'],
                'spanish' : ['la casa', 'el apartamento', 'la casa', 'el alquiler', 'el lugar', 'el dormitorio', 'el baño', 'la cocina', 'la sala de estar', 'el segundo piso']
            },
        'questions': {
            'english' : ['Describe your house'],
            'spanish': ['Describa su casa']
        },

        'phrases': {
            'english' : ['I live in an apartment. It has great location, but it is pretty small: it has one bedroom, one bathroom, one kitchen and a tiny living room'],
            'spanish': ['Yo vivo en un apartamento. Tiene una gran ubicación, pero es bastante pequeño: tiene un dormitorio, un cuarto de baño, una cocina y una sala de estar pequeña.']
        }
    },

    'Entertainment':{
        'translations': {'english': 'Entertainment', 'spanish': 'El entreterimiento'},
            'words' : {
                'english' : ['listen to music', 'go to the movies', 'watch TV', 'play soccer','read a book', 'play computer games', 'go on a hike', 'go to the theatre', 'go out', 'do the laundry'],
                'spanish' : ['escuchar música', 'ir al cine', 'ver televisión', 'jugar al fútbol', 'leer un libro', 'jugar a juegos de ordenador', 'darse una caminata', 'ir al teatro','salir ',' hacer la colada ']
            },
        'questions': {
            'english' : ['What do you do for fun?'],
            'spanish': ['¿Qué haces para divertirte?']
        },

        'phrases': {
            'english' : ['I like listening to music and playing computer games, but I hate doing the laundry.'],
            'spanish': ["Me gusta escuchar música y jugar juegos de ordenador, pero no me gusta lavar la ropa."]
        }
    },

    'Professions':{
        'translations': {'english': 'Professions', 'spanish': 'Las profesiones'},
            'words' : {
                'english' : ['engineer', 'lawyer', 'doctor', 'artist', 'musician', 'internship','software developer', 'policeman(woman)', 'firefighter', 'businessman(woman)'],
                'spanish' : ['ingeniero(a)', 'abogado(a)', 'doctor(a)', 'artista', 'músico(a)','las practicas profesionales', 'desarrollador(a) de software', 'policía',' bombero(a)','hombre(mujer) de negocios']
            },
        'questions': {
            'english' : ['If you could be anything, what would you be?'],
            'spanish': ['Si pudieras ser cualquier cosa, ¿qué serías?']
        },

        'phrases': {
            'english' : ['I would be an artist.'],
            'spanish': ['Me gustaría ser un artista.']
        }
    },

    'Study':{
        'translations': {'english': 'Study', 'spanish': 'El Studio'},
            'words' : {
                'english' : ['school', 'university', 'student', 'teacher', 'professor', 'class','major', 'college', 'grade', 'exam'],
                'spanish' : ['la escuela', 'la universidad', 'el estudiante', 'maestro(a)','profesor(a)', 'la clase', 'la especialidad', 'el colegio', 'la nota', 'el examen']
            },
        'questions': {
            'english' : ['How is your school?'],
            'spanish': ['¿Cómo es tu escuela?']
        },

        'phrases': {
            'english' : ['My school is big: there are over ten thousand students. We have many exams and it is hard to get a good grade on them.'],
            'spanish': ['Mi escuela es grande: hay más de diez mil estudiantes. Tenemos muchos exámenes y es difícil conseguir una buena nota en ellos.']
        }
    },

    'Sport':{
        'translations': {'english': 'Sport', 'spanish': 'El deporte'},
            'words' : {
                'english' : ['soccer', 'tennis', 'baseball', 'football', 'basketball', 'skiing','chess', 'cycling', 'swimming', 'running'],
                'spanish' : ['el fútbol', 'el tenis', 'el baseball', 'el fútbol americano', 'el baloncesto', 'el esquí', 'el ajedrez', 'el ciclismo', 'natación', 'correr']
            },
        'questions': {
            'english' : ['What is your favorite sport?'],
            'spanish': ['¿Cuál es tu deporte favorito?']
        },
        'phrases': {
            'english' : ['My favorite sport is soccer, but I also like skiing in the winter.'],
            'spanish': ['Mi deporte favorito es el fútbol, ​​pero también me gusta el esquí en el invierno']
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
    var topicInfo = {'native':{topic:'', words:[], questions:[], phrases: []}, 'chat': {topic:'', words:[], questions:[], phrases: []}};

    //set up native translations
    topicInfo.native.topic = topicData.translations[nativeLanguage];
    topicInfo.native.words = topicData.words[nativeLanguage];
    topicInfo.native.questions = topicData.questions[nativeLanguage];
    topicInfo.native.phrases = topicData.phrases[nativeLanguage];

    //set up chat translations
    topicInfo.chat.topic = topicData.translations[chatLanguage];
    topicInfo.chat.words = topicData.words[chatLanguage];
    topicInfo.chat.questions = topicData.questions[chatLanguage];
    topicInfo.chat.phrases = topicData.phrases[chatLanguage];

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
        var numTopics = topicList.length;
        var topic = topicList[Math.floor(Math.random() * numTopics)];
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
    var numTopics = topicList.length;
    var topic = topicList[Math.floor(Math.random() * numTopics)];
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


