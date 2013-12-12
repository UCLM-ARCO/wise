// -*- mode: js; coding: utf-8 -*-

function template(name) {
    return $('#TEMPLATES > .' + name).clone().wrap('<p>').parent().html()
}

RoomServant = Class.extend({
    send: function(nick, message) {
	append_message("Channel", nick, message);
    },

    notify_added_member: function(nick) {
	var item = template('member').format(nick);
	$('#members').append(item);

	var item = template('messages').format(nickname);
	$('#notepad').append(item.hide());
    },

    notify_removed_member: function(nick) {
	$('#member-' + nick).remove();
    },
});

PrivateServant = Class.extend({
    send: function(nick, message) {
	append_message(nick, nick, message);
    },
});

function append_message(tab_name, nick, message) {
    badge_inc(tab_name);
    var tab = $('#messages-' + tab_name);
    tab.append("<b>{0}:</b> {1}<br/>".format(nick, message));
//    tab.stop().animate({ scrollTop: tab[0].scrollHeight }, 800);
}

function badge_inc(nick) {
    var member_id = '#member-' + nick;
    if ($(member_id).hasClass('active'))
	return;

    var badge = $(member_id +' > .badge');
    var badge_num = parseInt(badge.text()) || 0;
    badge.text(badge_num + 1);
}

function badge_clean(nick) {
    var member_id = '#member-{0} > .badge'.format(nick);
    $(member_id).text('');
}

function wise_application(ws) {
    broker = ws;

    // create an object adapter to register our servant
    ws.createObjectAdapter("WebAdapter")
	.on_response(on_adapter_ready);

    function on_adapter_ready(adapter) {
	room_servant = new RoomServant();
	room_listener = adapter.addWithUUID(room_servant);
	private_listener = adapter.addWithUUID(new PrivateServant());

	// create a proxy to the observable in server
	ws.stringToProxy("chat1 -w ws1")
	    .on_response(on_stringToProxy_response);

	function on_stringToProxy_response(proxy) {
	    chatroom = proxy;
	    target = chatroom;
	    ws.ready();
//	    return;
	    autologin();
	}
    }
}

function autologin() {
    $('#nickname').val(wise.Util.generate_UUID());
    $('#login-button').click();
}

// UI callbacks
function login() {
    nickname = $('#nickname').val();
    if (! nickname)
	return wrong_login();

    $('#login').hide();
    $('#chat').show();

    chatroom.subscribe(nickname, room_listener, private_listener);

    room_servant.notify_added_member("Channel");
    $('#member-Channel').addClass('active');
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
    var nickname = item.attr('id').replace('member-', '');

    if (nickname == $('#nickname').val())
	return;

    change_member(item);
    badge_clean(nickname);
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
    $('#messages-' + nickname).show();
}

function send_message() {
    var message = $('#content').val();

    if (! message)
        return;

    target.send(nickname, message);

    $('#content').val('');
}
