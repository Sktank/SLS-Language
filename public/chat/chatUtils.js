
var socket = io.connect();
$.fn.raty.defaults.path = '/img';
$.fn.raty.defaults.size = 24;
$.fn.raty.defaults.half = true;

function addRatings() {
    $('#reviewContainer').fadeIn(300);
    var profClicked = false;
    var satClicked = false;
    var path = window.location.pathname;
    var language = path.split('/')[2].toLowerCase();
    $('#proficiency-review').raty({
        starOff: 'star-off-big.png',
        starOn: 'star-on-big.png',
        starHalf: 'star-half-big.png',
        half: true,
        size: 24,
        click: function(score, evt) {
            if (profClicked == false) {
                profClicked = true;
                socket.emit('profReview', score, language);
                if (satClicked) {
                    $('#profReviewContainer').fadeOut(300).promise().done(reviewThankYou);
                }
                else {
                    $('#profReviewContainer').fadeOut(300);
                }

            }
        }
    });
    $('#satisfaction-review').raty({
        starOff: 'star-off-big.png',
        starOn: 'star-on-big.png',
        starHalf: 'star-half-big.png',
        half: true,
        size: 24,
        click: function(score, evt) {
            if (satClicked == false) {
                satClicked = true;
                socket.emit('satReview', score, language);
                if (profClicked) {
                    $('#satReviewContainer').fadeOut(300).promise().done(reviewThankYou);

                }
                else {
                    $('#satReviewContainer').fadeOut(300);

                }
            }
        }
    });
}

function reviewThankYou() {
    $('#review-thankyou').fadeIn(300).promise().done(function() {
        setTimeout(function () {
            $('#reviewContainer').fadeOut(1000);
        }, 2000);
    });
}

function scrollBottom(elemId) {
    var element    = $('#' + elemId);
    var height = element[0].scrollHeight;
    element.scrollTop(height);
}

function addMessage(msg, pseudo) {
    $("#chatEntries").append('<div class="message"><p><b>' + pseudo + ' :</b> ' + msg + '</p></div>');
    scrollBottom('chatEntries');
}

function addWarning(msg, pseudo) {
    $("#chatEntries").append('<div class="message warning-message"><p><b>' + pseudo + ' :</b> ' + msg + '</p></div>');
    scrollBottom('chatEntries');
}

function warnUser(language) {
    addWarning("Stop speaking in " + language + " or you will be kicked out!", "SLS Chat")
}

socket.on('message', function(data) {
    addMessage(data, 'Language Partner');
});


socket.on('languageWarning', function(data) {
   warnUser(data);
});

socket.on('start', function(room, reviews) {
    var REVIEW_TIME = 5000;
    $('#chat-status').text('Chat Initialized');

    // allow users to send messages
    function sentMessage() {
        if ($('#messageInput').val() != "")
        {
            socket.emit('message', {room: room, data:$('#messageInput').val()});
            addMessage($('#messageInput').val(), "You");
            setTimeout(function() {
                $('#messageInput').val('');
            }, 10);

        }
    }
    $("#messageInput").on('', function() {sentMessage();});
    $('#chatControls').show();
    $('#messageInput').keypress(function(e) {
        console.log(e);
        var code = e.keyCode || e.which;
        if(code == 13) {
            sentMessage();
        }
    });
    $("#messageInput").attr('disabled', false);

    // begin the rating timer

    if (reviews) {
        socket.reviewTimer = setTimeout(function() {
            addRatings();
        }, REVIEW_TIME)
    }



});

socket.on('end', function() {
    $('#chat-status').text('User Disconnected');
    $('#chatControls').hide();
});


$(function () {
    $("#messageInput").attr('disabled', true);
    var path = window.location.pathname;
    var native;
    var language = path.split('/')[2].toLowerCase();
    var level = path.split('/')[3];
    var nativeQueue = path.split('/')[4];
    if (nativeQueue === '1') {
        native = true;
    }
    else {
        native = false;
    }

    //cookie business
    var guid = checkCookie();

    socket.emit('setChatRoom', language, level, native, guid);
});


//cookie functions
function setCookie(cname,cvalue,exdays)
{
    var d = new Date();
    d.setTime(d.getTime()+(exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname)
{
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++)
    {
        var c = ca[i].trim();
        if (c.indexOf(name)==0) return c.substring(name.length,c.length);
    }
    return "";
}

function checkCookie()
{
    var guid=getCookie("guid");
    if (guid=="")
    {
        guid = createGUID();
        {
            setCookie("guid",guid,365);
        }
    }
    return guid;
}

//guid function

function createGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}