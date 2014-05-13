/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/6/14
 * Time: 2:02 PM
 * To change this template use File | Settings | File Templates.
 */

// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },

    name             : {
        first        : String,
        last         : String
    },

    teacherCourses   : { type : Array , "default" : [] },
    studentCourses   : { type : Array , "default" : [] },

    alerts           : { type : Array , "default" : [] },

    school           : String,

    lessons          : { type : Array , "default" : [] }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

userSchema.virtual('name.full').get(function () {
    return this.name.first + ' ' + this.name.last;
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);

