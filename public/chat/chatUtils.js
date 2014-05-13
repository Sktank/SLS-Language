
var socket = io.connect();
$.fn.raty.defaults.path = '/img';
$.fn.raty.defaults.size = 24;
$.fn.raty.defaults.half = true;

var msgCount = 0;

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


function addWarning(msg, pseudo) {
    $("#chatEntries").append('<div class="message warning-message"><p><b>' + pseudo + ' :</b> ' + msg + '</p></div>');
    scrollBottom('chatEntries');
}

function warnUser(language) {
    addWarning("Stop speaking in " + language + " or you will be kicked out!", "SLS Chat")
}

//socket.on('message', function(data) {
//    addMessage(data, 'Language Partner');
//});


socket.on('languageWarning', function(data) {
   warnUser(data);
});

socket.on('start', function(room, reviews, topicInfo) {
    var REVIEW_TIME = 5000;
    var edits = {};


    $('#chat-status').text(document.chatInit);

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

    // set up the topic display
    $("#chatTopicContainer").html("<h3 class='chatTopic'>" + topicInfo.chat.questions[0] + "</h3><h5 class='chatTopic'>(" + topicInfo.native.questions[0] + ")</h5><hr class='cutoff-hr'>");
    $("#chatContainer").append("<div id='chatEntries'></div>");
    var words = "";
    for (var i = 0; i < topicInfo.native.words.length; i++) {
        words = words + "<div><b>" + topicInfo.native.words[i] + ":</b> " + topicInfo.chat.words[i] + "</div>"
    }

    var phrases = "";
    for (var i = 0; i < topicInfo.native.phrases.length; i++) {
        phrases = phrases + "<div><b>" + topicInfo.native.phrases[i] + ":</b> " + topicInfo.chat.phrases[i] + "</div>"
    }

    $("#relatedWords").append("<h4>" + document.relatedWords + "</h4>");
    $("#relatedWords").append(words);

    $("#relatedWords").append("<br><h4>" + document.relatedPhrases + "</h4>");
    $("#relatedWords").append(phrases);



    // begin the rating timer

    if (reviews) {
        socket.reviewTimer = setTimeout(function() {
            addRatings();
        }, REVIEW_TIME)
    }

    socket.on('message', function(data) {
        addMessage(data, 'Language Partner');
    });

    function addMessage(msg, pseudo) {
        var color;
        if (pseudo === "You") {
            color = "grey;";
            $("#chatEntries").append('<div class="message" data-toggle="popover"><p><span id="msg' + msgCount + '"><i class="fa fa-pencil-square-o" style="color: ' + color + '"></i> <b>' + pseudo + ' :</b></span> ' + msg + '</p></div>');

        }
        else {
            color = "green;"
            $("#chatEntries").append('<div class="message" data-toggle="tooltip"><p><span class="msgPop clickable" id="msg' + msgCount + '"><i class="fa fa-pencil-square-o" style="color: ' + color + '"></i> <b>' + pseudo + ' :</b></span> ' + msg + '</p></div>');

        }
        if (pseudo != "You") {
            $("#msg" + msgCount).popover({
                html: true,
                title: "<b>Suggestion</b>",
                content: "<input id='edit" + msgCount + "' class='edit-input'/>",
                placement: "top"
            });


        }
        initSuggestion(msgCount);
        msgCount = msgCount + 1;
        scrollBottom('chatEntries');
    }

    $('#chatEntries').bind('scroll', function() {
        console.log("scrolling");
        $(".msgPop").popover('hide');
    });


    function initSuggestion(msgNum) {
        $(document).on('keypress', "#edit" + msgNum, function(e) {
            console.log(msgNum);
            console.log(e);
            var code = e.keyCode || e.which;
            if(code == 13) {
                sendSuggestion(msgNum);
            }
        });

        $(document).on('click', "#msg" + msgNum, function() {
            $("#edit" + msgNum).focus();
        })

    }

    function sendSuggestion(msgNum) {
        $("#msg" + msgNum).popover('hide');
        console.log($("#edit" + msgNum).val());
        $("#msg" + msgNum + "> .fa").css("color", "gold");
        socket.emit('suggestion', {room: room, data:$("#edit" + msgNum).val(), msgNum: msgNum});
        console.log(msgNum);
        edits[msgNum] = $("#edit" + msgNum).val();
        $("#msg" + msgNum).popover('destroy');
        $("#msg" + msgNum).popover({
            html: true,
            title: "<b>Suggestion</b>",
            content: "<input id='edit" + msgCount + "' class='edit-input' value='" + edits[msgNum] + "'/>",
            placement: "top"
        });
    }

    socket.on('suggestion', function(data, msgNum) {
        $("#msg" + msgNum + "> .fa").css("color", "red");
        console.log(msgNum);
        $("#msg" + msgNum).tooltip({
            html: true,
            title: "<b>" + data + "</b>",
            placement: "top"
        });
    })

});

socket.on('end', function() {
    $('#chat-status').text(document.chatEnd);
    $('#chatControls').hide();
});


$(function () {
    $("#wtf").popover();
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