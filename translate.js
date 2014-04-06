/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/6/14
 * Time: 4:59 PM
 * To change this template use File | Settings | File Templates.
 */

// =========================================================
//                Google Translate Utilities
// =========================================================

var request  = require('request');
var googleApiKey = 'AIzaSyDyYwY9iZG8Jr2uv_6aRscKqybfYwN9S2E';

var languageCodes = {
    "en": "english",
    "es": "spanish",
    "fr": "french",
    "de": "german",
    "it": "italian",
    "zh-CN": "chinese",
    "ja": "japanese",
    "ar": "arabic"
};

exports.detectLanguage = function(socket, message) {
    request('https://www.googleapis.com/language/translate/v2/detect?key=' + googleApiKey + '&q=' + message, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body); // Print the lookup
            var info = eval("value = (" + body + ")");
            var result = info.data.detections[0][0];
            var detectedLanguage = languageCodes[result.language];
            console.log(result);
            if (detectedLanguage != socket.language && result.language != "null" && result.language != "und" && result.confidence > 0.8) {
                if (detectedLanguage) {
                    socket.emit('languageWarning', detectedLanguage)
                }
                else {
                    socket.emit('languageWarning', result.language)
                }
            }

        }
    });
}