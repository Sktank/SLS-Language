var anonUser       		= require('./app/models/anonUser');

exports.update = function(guid, score, language, numType, scoreType, notNumType, notScoreType) {
    console.log("logging prof review");
    console.log(guid + "," +  score);
    anonUser.findOne({ 'guid': guid }, function (err, user) {
        if (err) return err;
        if (!user) {
            return false;
        }
        console.log("actually updating");
        var numRatings = user[language][numType] + 1;
        var totalScore = user[language][scoreType] + score;
        console.log(user);
        console.log("num: " + numRatings);
        console.log("score: " + totalScore);

        var update = {};
        update[language] = {};
        update[language][numType] = numRatings;
        update[language][scoreType] = totalScore;
        update[language][notNumType] = user[language][notNumType];
        update[language][notScoreType] = user[language][notScoreType];

        anonUser.findOneAndUpdate({ 'guid': guid }, update, function() {
            console.log("why the fuck do I have to pass a callback to save immediately");
        })
    });
};
