/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/24/14
 * Time: 7:29 PM
 * To change this template use File | Settings | File Templates.
 */

// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var courseSchema = mongoose.Schema({

    name             : String,
    school           : String,

    students         : { type : Array , "default" : [] },

    teacher          : String,
    instructors      : { type : Array , "default" : [] },
    exchanges        : { type : Array , "default" : [] }
});

module.exports = mongoose.model('Course', courseSchema);