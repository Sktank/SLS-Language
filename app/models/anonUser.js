/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/16/14
 * Time: 12:58 AM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');

var anonUserSchema = mongoose.Schema({

    guid                 : String,


    english              : {
        totalChats       : Number,
        numProfReviews   : Number,
        totalProfScore   : Number,
        numSatReviews    : Number,
        totalSatScore    : Number
    },

    spanish              : {
        totalChats       : Number,
        numProfReviews   : Number,
        totalProfScore   : Number,
        numSatReviews    : Number,
        totalSatScore    : Number
    },

    french               : {
        totalChats       : Number,
        numProfReviews   : Number,
        totalProfScore   : Number,
        numSatReviews    : Number,
        totalSatScore    : Number
    },

    german               : {
        totalChats       : Number,
        numProfReviews   : Number,
        totalProfScore   : Number,
        numSatReviews    : Number,
        totalSatScore    : Number
    },

    italian              : {
        totalChats       : Number,
        numProfReviews   : Number,
        totalProfScore   : Number,
        numSatReviews    : Number,
        totalSatScore    : Number
    },

    chinese              : {
        totalChats       : Number,
        numProfReviews   : Number,
        totalProfScore   : Number,
        numSatReviews    : Number,
        totalSatScore    : Number
    },

    japanese             : {
        totalChats       : Number,
        numProfReviews   : Number,
        totalProfScore   : Number,
        numSatReviews    : Number,
        totalSatScore    : Number
    },

    arabic               : {
        totalChats       : Number,
        numProfReviews   : Number,
        totalProfScore   : Number,
        numSatReviews    : Number,
        totalSatScore    : Number
    }

});

anonUserSchema.methods.avgProf = function() {
    return this.totalProfScore / this.numProfReviews;
};

anonUserSchema.methods.avgSat = function() {
    return this.totalSatScore / this.numSatReviews;
};

module.exports = mongoose.model('anonUser', anonUserSchema);