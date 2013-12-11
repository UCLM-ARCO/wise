// -*- mode: js; coding: utf-8 -*-

RoomServant = Class.extend({
    send: function(nick, message) {
	add_message("Channel", nick, message);
    },

    notify_added_member: function(nick) {
	var item = $('<a href="#" class="list-group-item" '
		     + 'onClick="select_member(this)">{0}</a>'.format(nick));
	$('#members').append(item);
    },

    notify_removed_member: function(nick) {
    },
});

PrivateServant = Class.extend({
    send: function(nick, message) {
	add_message(nick, nick, message);
    },
});

function add_message(tab, nick, message) {
    var widget = $('#messages-{0}'.format(tab));
    widget.append("<b>{0}</b>: {1}<br/>".format(nick, message));
    widget.stop().animate({ scrollTop: widget[0].scrollHeight }, 800);
}


// create the entry point which will be called automatically
function wise_application(ws) {
    broker = ws;

    // create an object adapter to register our servant
    ws.createObjectAdapter("WebAdapter")
	.on_response(on_adapter_ready);

    function on_adapter_ready(adapter) {
	room_listener = adapter.addWithUUID(new RoomServant());
	private_listener = adapter.addWithUUID(new PrivateServant());

	// create a proxy to the observable in server
	ws.stringToProxy("chat1 -w ws1")
	    .on_response(on_stringToProxy_response);

	function on_stringToProxy_response(proxy) {
	    chatroom = proxy;
	    target = chatroom;
	    ws.ready();
	    return;
	    autologin();
	}
    }
}

function autologin() {
    $('#nickname').val('user1');
    $('#login-button').click();
}

// UI callbacks
function send_message() {
    var message = $('#content').val();

    if (! message)
        return;

    target.send(nickname, message);
}

function login() {
    nickname = $('#nickname').val();
    if (! nickname)
	return wrong_login();

    $('#login').hide();
    $('#chat').show();

    chatroom.subscribe(nickname, room_listener, private_listener);
}

function wrong_login() {
    $('#wrong-login').remove();

    var message = $('#wrong-login-proto').clone();
    message.attr('id', 'wrong-login');
    message.appendTo('#login');
    message.show();
}

function select_member(item) {
    item = $(item);
    var nickname = item.text();

    if (nickname ==  $('#nickname').val())
	return;

    change_member(item);
    change_tab(nickname);

    if (nickname == "Channel") {
	target = chatroom;
	return
    }

    chatroom.get_member(nickname)
	.on_response(on_get_member_response)

    function on_get_member_response(strproxy) {
	broker.stringToProxy(strproxy)
	    .on_response(on_stringToProxy_response);
    }

    function on_stringToProxy_response(proxy) {
	target = proxy;
	_(target);
    }
}

function change_member(item) {
    $('#members a').removeClass('active');
    item.addClass("active");
}

function change_tab(nickname) {
    $('#notepad div').hide();

    var tabid = 'messages-{0}'.format(nickname);

    if ($('#' + tabid).length == 0) {
	var item = $('<div id="{0}" class="messages panel-body"></div>'.format(tabid));
	$('#notepad').append(item);
    }

    $('#' + tabid).show();
}
