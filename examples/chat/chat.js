// -*- mode: js; coding: utf-8 -*-

Servant = Class.extend({
    send: function(nick, message) {
	var widget = $('#messages-{0}'.format(nick));
	widget.append("<b>{0}</b>: {1}<br/>".format(nick, message));
        widget.stop().animate({ scrollTop: widget[0].scrollHeight }, 800);
    },

    new_member: function(nick) {
	var list = $('#members');
	var item = $('<a href="#" onClick="select_member(this)"'
		     + ' class="list-group-item">{0}</a>'.format(nick));
	list.append(item);
    },
});

// create the entry point which will be called automatically
function wise_application(ws) {
    // create an object adapter to register our servant
    ws.createObjectAdapter("WebAdapter")
	.on_response(on_adapter_ready);

    function on_adapter_ready(adapter) {
	observer = adapter.addWithUUID(new Servant());

	// create a proxy to the observable in server
	ws.stringToProxy("chat1 -w ws1")
	    .on_response(on_stringToProxy_response);

	function on_stringToProxy_response(proxy) {
	    chat = proxy;
	    ws.ready();

	    return;
	    $('#nickname').val('user1');
	    $('#login-button').click();
	}
    }
}

// UI callbacks
function send_to_chat() {
    var message = $('#content').val();

    if (! message)
        return;

    chat.send(nickname, message);
}

function enter_to_chat() {
    nickname = $('#nickname').val();
    if (! nickname) {
	$('#wrong-login').remove();

	var message = $('#wrong-login-proto').clone();
	message.attr('id', 'wrong-login');
	message.appendTo('#login');
	message.show();
	return;
    }

    $('#login').hide();
    $('#chat').show();

    chat.subscribe(nickname, observer);
}

function select_member(item) {
    item = $(item);

    $('#members a').removeClass('active');
    item.addClass("active");

    $('#notepad div').hide();

    var nickname = item.text();
    var tabid = 'messages-{0}'.format(nickname);

    if ($('#' + tabid).length == 0) {
	var item = $('<div id="{0}" class="messages panel-body"></div>'.format(tabid));
	$('#notepad').append(item);
    }

    $('#' + tabid).show();
}
