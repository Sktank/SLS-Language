/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/24/14
 * Time: 7:28 PM
 * To change this template use File | Settings | File Templates.
 */
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var schoolSchema = mongoose.Schema({

    name             : String,
    courses          : { type : Array , "default" : [] }
});

module.exports = mongoose.model('School', schoolSchema);