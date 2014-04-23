/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/16/14
 * Time: 10:32 AM
 * To change this template use File | Settings | File Templates.
 */
var anonUser       		= require('./app/models/anonUser');

var languages = ['english', 'spanish', 'french', 'german', 'italian', 'chinese', 'japanese', 'arabic'];

exports.processUser = function(guid) {
    return anonUser.findOne({ 'guid': guid }, function (err, user) {
        if (err) return err;
        if (!user) {
            var newAnonUser = new anonUser();

            // set up new anonUser

            newAnonUser.guid   = guid;

            for (var i = 0; i < languages.length; i++) {
                var lan = languages[i];
                newAnonUser[lan].totalChats = 0;
                newAnonUser[lan].numProfReviews = 0;
                newAnonUser[lan].totalProfScore = 0;
                newAnonUser[lan].numSatReviews = 0;
                newAnonUser[lan].totalSatScore = 0;
            }

            // save the user
            newAnonUser.save(function(err) {
                if (err)
                    throw err;
                console.log('user should be saved!');
            });
            return newAnonUser
        }
        return user;
    });
};