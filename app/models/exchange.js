/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/25/14
 * Time: 1:05 AM
 * To change this template use File | Settings | File Templates.
 */

// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var exchangeSchema = mongoose.Schema({

    name             : String,
    courses          : { type : Array , "default" : [] }
});

module.exports = mongoose.model('Exchange', exchangeSchema);