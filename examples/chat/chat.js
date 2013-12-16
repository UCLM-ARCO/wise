// -*- mode: js; coding: utf-8 -*-

function template(name) {
    return $('#TEMPLATES > .' + name).clone().wrap('<p>').parent().html()
}

RoomServant = Class.extend({
    send: function(nick, message) {
	append_remote_message("Channel", nick, message);
    },

    notify_added_member: function(nick) {
	var item = template('member').format(nick);
	$('#members').append(item);

	var item = template('messages').format(nick);
	$('#notepad').append(item);
	$('#messages-' + nick).hide();
    },

    notify_removed_member: function(nick) {
	$('#member-' + nick).remove();
    },
});

PrivateServant = Class.extend({
    send: function(nick, message) {
	append_remote_message(nick, nick, message);
    },
});

function append_remote_message(tab_name, nick, message) {
    badge_inc(tab_name);
    append_message(tab_name, nick, message);
}

function append_message(tab_name, nick, message) {
    _(tab_name, nick);

    var tab = $('#messages-' + tab_name);
    tab.append("<b>{0}:</b> {1}<br/>".format(nick, message));
    tab_animate(tab);
}

function tab_animate(tab) {
    tab.stop().animate({ scrollTop: tab[0].scrollHeight }, 800);
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
	    proxies = {};
	    proxies["Channel"] = proxy;
	    destination = "Channel";
	    chatroom = proxy;
	    ws.ready();
	    return;
	    autologin();
	}
    }
}

function autologin() {
    $('#mynickname').val(wise.Util.generate_UUID());
    $('#login-button').click();
}

// UI callbacks
function login() {
    mynickname = $('#mynickname').val();
    if (! mynickname)
	return wrong_login();

    $('#login').hide();
    $('#chat').show();

    chatroom.subscribe(mynickname, room_listener, private_listener);

    room_servant.notify_added_member("Channel");
    change_tab('Channel');
}

function wrong_login() {
    $('#wrong-login').remove();

    var item = template('alert').format('#wrong-login');
    $('#login').append(item);
}

function select_member(item) {
    item = $(item);
    var nickname = item.attr('id').replace('member-', '');

    if (nickname == mynickname)
	return;

    change_tab(nickname);
    badge_clean(nickname);
    destination = nickname;

    if (nickname == "Channel") {
	return
    }

    chatroom.get_member(nickname)
	.on_response(on_get_member_response)

    function on_get_member_response(strproxy) {
	broker.stringToProxy(strproxy)
	    .on_response(on_stringToProxy_response);
    }

    function on_stringToProxy_response(proxy) {
	proxies[nickname] = proxy;
    }
}

function change_tab(nick) {
    $('#notepad div').hide();
    $('#messages-' + nick).show();

    $('#members a').removeClass('active');
    $('#member-' + nick).addClass("active");
}

function send_message() {
    var message = $('#outgoing').val();
    $('#outgoing').focus().val('');

    if (! message)
        return;

    proxies[destination].send(mynickname, message);
    if (destination != "Channel")
	append_message(destination, mynickname, message);
}
