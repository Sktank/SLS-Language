
var socket = io.connect();

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

socket.on('start', function(room) {
    $('#chat-status').text('Chat Initialized');
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

});

socket.on('end', function() {
    $('#chat-status').text('User Disconnected');
    $('#chatControls').hide();
});


$(function () {
    $("#messageInput").attr('disabled', true);
    var path = window.location.pathname;
    var language = path.split('/')[2].toLowerCase();

    socket.emit('setLanguage', language);
});