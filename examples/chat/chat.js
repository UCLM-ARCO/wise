// -*- mode: js; coding: utf-8 -*-

function template(name) {
    return $('#TEMPLATES > .' + name).clone().wrap('<p>').parent().html()
}

RoomServant = Class.extend({
    send: function(nick, message) {
	UI.append_remote_message("Channel", nick, message);
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
	UI.append_remote_message(nick, nick, message);
    },
});

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
//	    return;
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
    UI.change_tab('Channel');
}

function wrong_login() {
    $('#wrong-login').remove();

    var item = template('alert').format('#wrong-login');
    $('#login').append(item);
}

function resolve_member_proxy(nick) {
    chatroom.get_member(nick)
	.on_response(on_get_member_response)

    function on_get_member_response(strproxy) {
	broker.stringToProxy(strproxy)
	    .on_response(on_stringToProxy_response);
    }

    function on_stringToProxy_response(proxy) {
	proxies[nick] = proxy;
    }
}

UI = {
    select_member: function(item) {
	item = $(item);
	var nickname = item.attr('id').replace('member-', '');

	if (nickname == mynickname)
	    return;

	UI.change_tab(nickname);
	UI.badge_clean(nickname);
	destination = nickname;

	if (nickname == "Channel") {
	    return
	}

	resolve_member_proxy(nickname);
    },

    change_tab: function(nick) {
	$('#notepad div').hide();
	$('#messages-' + nick).show();

	$('#members a').removeClass('active');
	$('#member-' + nick).addClass("active");
    },

    append_remote_message: function(tab_name, nick, message) {
	UI.badge_inc(tab_name);
	UI.append_message(tab_name, nick, message);
    },

    append_message: function(tab_name, nick, message) {
	var tab = $('#messages-' + tab_name);
	tab.append("<b>{0}:</b> {1}<br/>".format(nick, message));
	UI.tab_animate(tab);
    },

    tab_animate: function(tab) {
	tab.stop().animate({ scrollTop: tab[0].scrollHeight }, 800);
    },

    badge_inc: function(nick) {
	var member_id = '#member-' + nick;
	if ($(member_id).hasClass('active'))
	    return;

	var badge = $(member_id +' > .badge');
	var badge_num = parseInt(badge.text()) || 0;
	badge.text(badge_num + 1);
    },

     badge_clean: function(nick) {
	var member_id = '#member-{0} > .badge'.format(nick);
	$(member_id).text('');
    },

    send_message: function() {
	var message = $('#outgoing').val();
	$('#outgoing').focus().val('');

	if (! message)
            return;

	proxies[destination].send(mynickname, message);
	if (destination != "Channel")
	    UI.append_message(destination, mynickname, message);
    }
}
