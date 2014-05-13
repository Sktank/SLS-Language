/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 5/11/14
 * Time: 3:30 PM
 * To change this template use File | Settings | File Templates.
 */

// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var lessonSchema = mongoose.Schema({

    name             : String,
    user             : String,
    native           : String,
    foreign          : String,
    topics          : { type : Array , "default" : [] }
});

module.exports = mongoose.model('Lesson', lessonSchema);