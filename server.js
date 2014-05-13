
// =========================================================
//                        Imports
// =========================================================

var express = require('express'),
    jade     = require('jade'),
    http     = require('http'),
    random   = require("node-random"),
    swig     = require('swig'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash 	 = require('connect-flash'),
    configDB = require('./config/database.js'),
    queue    = require('./queue.js'),
    locale = require("locale"),
    I18n = require('i18n-2');
    supported = ["en", "es"];
//    port     = process.env.PORT || 8080;

mongoose.connect(configDB.url);

require('./config/passport')(passport); // pass passport for configuration

var app = express(),
    server = http.createServer(app);

exports.io = require('socket.io').listen(server);

// =========================================================
//                        Config
// =========================================================

app.configure(function() {
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.set('view engine', 'html');
    app.engine('html', swig.renderFile);
    app.use(locale(supported));


    // Attach the i18n property to the express request object
    // And attach helper methods for use in templates
    I18n.expressBind(app, {
        // setup some locales - other locales default to en silently
        locales: ['en', 'es'],
        // change the cookie name from 'lang' to 'locale'
        cookieName: 'locale'
    });

    // This is how you'd set a locale from req.cookies.
    // Don't forget to set the cookie either on the client or in your Express app.
    app.use(function(req, res, next) {
        console.log(req.cookies);
        if (!req.cookies.locale) {
            req.cookies.locale = req.locale;
        }
        req.i18n.setLocaleFromCookie();
        next();
    });

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
require('./sockets.js')(server, exports.io);


