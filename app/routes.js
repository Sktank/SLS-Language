/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/6/14
 * Time: 2:01 PM
 * To change this template use File | Settings | File Templates.
 */

var chat      = require('../chat'),
    School    = require('./models/school'),
    Course    = require('./models/course'),
    User      = require('./models/user'),
    Exchange  = require('./models/exchange'),
    locale    = require('locale'),
    supported = ["en", "fr"],
    languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Japanese', 'Arabic'];

module.exports = function(app, passport) {

    app.get('/', function (req, res) {
        console.log("You asked for: " + req.headers["accept-language"] + "\n" +
            "We support: " + supported + "\n" +
            "Our default is: " + locale.Locale["default"] + "\n" +
            "The best match is: " + req.locale + "\n");
        res.render(
            'home.html', {languages:languages}
        );
    });

    app.get('/chat/:language/:level/:native', chat.enter);

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.html', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.html', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {

        var user = req.user;

        School.findOne({ 'name' :  "Rutgers" }, function(err, school) {
            if (!school) {
                var newSchool = new School();
                newSchool.name = "Rutgers";
                newSchool.save(function(err) {
                    if (err)
                        throw err;
                    console.log('school should be saved!');
                    return 0;
                });
            }
        });



        School.findOne({ 'name' :  req.user.school }, function(err, school) {
            // if there are any errors, return the error
            if (err)
                return "fuck";
            if (!school) {
                res.redirect("/login");
            }
            else {
                //find disjoint of school classes and user classes
                console.log(req.user.studentCourses[0]);
                if (school.courses) {
                    for (var i = 0; i < school.courses.length; i++) {
                        console.log(school.courses[i].name);
                        if (req.user.studentCourses.indexOf(school.courses[i].name) >= 0) {
                            console.log("taken");
                            school.courses[i]['taken'] = 1;
                        }
                    }
                }

                res.render('profile.html', {
                    user   : user, // get the user out of session and pass to template
                    school : school
                });
            }
        });
    });

    app.get('/courses/:courseName', isLoggedIn, function(req, res) {
        var courseName = req.params.courseName;
        console.log(courseName);
        console.log(req.user.school);
        console.log(req.user.local.email);

        //check if you are a teacher in the course
        Course.findOne({ 'name' :  courseName , 'school': req.user.school, 'instructors.email': req.user.local.email}, function(err, course) {
            // if there are any errors, return the error
            console.log(course);
            if (err)
                console.log("fuck");
            if (course)  {
                console.log("should render");
                res.render('course.html', {
                    course: course,
                    status: "teacher"
                })
            }
            else {
                //check if you are a student in the course
                Course.findOne({ 'name' :  courseName , 'school': req.user.school, 'students.email': req.user.local.email}, function(err, course) {
                    // if there are any errors, return the error
                    if (err)
                        console.log("fuck");
                    if (course) {
                        res.render('course.html', {
                            course: course,
                            status: "student"
                        })
                    }
                    else {
                        console.log("redirecting");
                        res.redirect("/profile");
                    }
                });
            }
        });
    });

    app.get('/exchanges/:exchangeName', isLoggedIn, function(req, res) {
        var exchangeName = req.params.exchangeName;

        Exchange.findOne({ 'name' : exchangeName, 'courses.teacher': req.user.local.email}, function(err, exchange) {
            // if there are any errors, return the error
            console.log(exchange);
            if (err)
                console.log("fuck");
            if (exchange)  {
                res.render('exchange.html', {
                    exchange: exchange
                })
            }
            else {
                console.log("redirecting");
                res.redirect("/profile");
            }

        });
    });


    app.post('/register_course', isLoggedIn, function(req, res) {
        res.setHeader('Content-Type', 'application/json');

        console.log(req.body.name);

        Course.findOne({ 'name' :  req.body.name , 'school': req.user.school}, function(err, course) {
            // if there are any errors, return the error
            if (err)
                return "fuck";
            if (course) {
                res.end(JSON.stringify({ resp: "Course Exists!" }));
            }
            else {
                // create the course
                var newCourse = new Course();
                newCourse.name = req.body.name;
                newCourse.school = req.user.school;
                newCourse.teacher = req.user.local.email;
                var instructors = [];
                instructors.push({'name': req.user.name.full, 'email':req.user.local.email});
                newCourse.instructors = instructors;
                newCourse.save(function(err) {
                    if (err)
                        throw err;
                    console.log('course should be saved!');
                    return 0;
                });

                //add the course to the current users info
                User.update({'local.email': req.user.local.email},{$addToSet: {teacherCourses: req.body.name}},{upsert:true},function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Successfully added");
                    }
                });

                //add the course to the schools info
                School.update({'name': req.user.school},{$addToSet: {courses: {'name': req.body.name, 'teacher': req.user.name.full}}},{upsert:true},function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Successfully added");
                    }
                });
            }
        });



        res.end(JSON.stringify({ resp: "course registered" }));
    });

    app.post("/register_exchange", isLoggedIn, function(req, res) {
        Exchange.findOne({ 'name' :  req.body.name}, function(err, course) {
            // if there are any errors, return the error
            if (err)
                return "fuck";
            if (course) {
                res.end(JSON.stringify({ resp: "Exchange Name Exists!" }));
            }
            else {
                // create the course
                var newExchange = new Exchange();
                newExchange.name = req.body.name;
                var courses = [];
                courses.push({'name': req.body.course, 'school':req.user.school, 'teacher': req.user.local.email});
                newExchange.courses = courses;
                newExchange.save(function(err) {
                    if (err)
                        throw err;
                    console.log('exchange should be saved!');
                    return 0;
                });

                // add exchange to course
                Course.update({'name': req.body.course, 'school': req.user.school},{$addToSet: {exchanges: req.body.name}},{upsert:true},function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Successfully added");
                    }
                });

                res.end(JSON.stringify({ resp: "exchange registered" }));
            }
        });
    });


    app.post('/exchange_invite', isLoggedIn, function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        // look up course
        Course.findOne({ 'name' :  req.body.course , 'school': req.body.school}, function(err, course) {
            // if there are any errors, return the error
            if (err)
                return "fuck";
            if (!course) {
                res.end(JSON.stringify({ resp: "Course Does Not Exist!" }));
            }
            else {
                // course exists send an invite to its teacher
                User.update({'local.email': course.teacher},{$push: {
                    alerts: {
                        'type': 'exchange invite',
                        'contents': {
                            'course'   : req.body.course,
                            'exchange' : req.body.exchange,
                            'inviter'  : req.user.local.email
                        }
                    }
                }},{upsert:true},function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Successfully sent");
                        res.end(JSON.stringify({ resp: "invite sent" }));
                    }
                });

            }
        });
    });

    app.post('/accept_exchange_invite', isLoggedIn, function(req, res) {
        res.setHeader('Content-Type', 'application/json');

        // update exchange
        Exchange.update({'name': req.body.exchange},{$addToSet: {courses: {'name': req.body.course, 'school':req.user.school, 'teacher': req.user.local.email}}},{upsert:true},function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Exchange Successfully updated");
            }
        });

        // update course
        Course.update({'name': req.body.course, 'school': req.user.school},{$addToSet: {exchanges: req.body.exchange}},{upsert:true},function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Course successfully updated");
            }
        });

        // delete the invite


        res.end(JSON.stringify({ resp: "invite accepted" }));


    });



    app.post('/enroll_course', isLoggedIn, function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        Course.update({ 'name' :  req.body.name , 'school': req.user.school},{$addToSet: {students: {'name': req.user.name.full, 'email': req.user.local.email}}},{upsert:true},function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Successfully added");
            }
        });

        User.update({ 'local.email' : req.user.local.email },{$addToSet: {studentCourses: req.body.name }},{upsert:true},function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Successfully added");
            }
        });

        res.end(JSON.stringify({ resp: "course enrolled" }));
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');

};






