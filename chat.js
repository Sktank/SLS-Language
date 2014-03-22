/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 3/16/14
 * Time: 12:05 PM
 * To change this template use File | Settings | File Templates.
 */

exports.enter = function(req, res) {

    var chatLanguage = req.params.language;

    res.render('chat/chat.jade', {
        language: chatLanguage
    })
};
