// -*- mode: js; coding: utf-8 -*-

function template(name) {
    return $('#TEMPLATES > .' + name).clone().wrap('<p>').parent().html();
}

function widget_animate(widget) {
    widget.stop().animate({ scrollTop: widget[0].scrollHeight }, 800);
};


Servant = Class.extend({
    send: function(nick, message, private) {
	var member = (private) ? nick : "Channel";
	members[member].append_remote_message(nick, message);
    },

    notify_added_member: function(nick) {
	members[nick] = new Member(nick);
    },

    notify_removed_member: function(nick) {
	// FIXME: never called
	// destroy_member(nick);
    },
});

function wise_application(ws) {
    broker = ws;
    members = {};

    // create an object adapter to register our servant
    ws.createObjectAdapter("WebAdapter")
	.on_response(on_adapter_ready);

    function on_adapter_ready(adapter) {
	room_listener = adapter.addWithUUID(new Servant());

	// create a proxy to the observable in server
	ws.stringToProxy("chat1 -w ws1")
	    .on_response(on_stringToProxy_response);

	function on_stringToProxy_response(proxy) {
	    chatroom = proxy;
	    set_UI_callbacks();
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

function set_UI_callbacks() {
    $('#login-button').click(login);
    $('#send-button').click(send_message);
    $('#send-button').keypress(function() {
	if (event.keyCode == 13)
	    send_message();
    });
}

function login() {
    mynickname = $('#mynickname').val();
    if (mynickname === "") {
	$('#wrong-login').show().delay(2000).fadeOut(300);
	return;
    }

    $('#login').hide();
    $('#chat').show();

    chatroom.subscribe(mynickname, room_listener);

    channel = new Member("Channel", chatroom);
    channel.select();
    members['Channel'] = channel;
}

function send_message() {
    var message = $('#outgoing').val();
    $('#outgoing').focus().val('');

    if (message === "")
        return;

    private = (destination !== "Channel")
    members[destination].proxy.send(mynickname, message, private)
	.on_error(function(error) {
	    _(error);
	    destroy_member(destination);
	})

    if (private)
	members[destination].append_message(mynickname, message);
}

function resolve_member_proxy(nick) {
    chatroom.get_member(nick)
	.on_response(on_get_member_response)
	.on_error(on_get_member_error)

    function on_get_member_response(strproxy) {
	broker.stringToProxy(strproxy)
	    .on_response(on_stringToProxy_response);
    }

    function on_stringToProxy_response(proxy) {
	members[nick].proxy = proxy;
    }
    function on_get_member_error(error) {
	_(error);
	destroy_member(nick);
    }
}

function destroy_member(nick) {
    members[nick].destroy();
    delete members[nick];
    members["Channel"].select();
}

function select_member(item) {
    item = $(item);
    var nick = item.attr('id').replace('member-', '');
    members[nick].select();
}

Member = Class.extend({
    init: function(nick, proxy) {
	this.nick = nick;
	this.proxy = proxy;

	var are_you = (nick == mynickname) ? " <b>(you)</b>" : "";

	template('member').render(nick, are_you).appendTo('#members');

	if (are_you) return;

	template('incoming').render(nick).appendTo('#notepad');
	$('#incoming-' + nick).hide();
    },

    destroy: function() {
	this.tab().remove();
	$('#member-' + this.nick).remove();
    },

    tab: function() {
	return $("#incoming-" + this.nick);
    },

    button: function() {
	return $("#member-" +  this.nick);
    },

    badge: function() {
	return $('#member-{0} > .badge'.format(this.nick));
    },

    tab_switch: function() {
	$('#notepad div').hide();
	this.tab().show();

	$('#members a').removeClass('active');
	this.button().addClass("active");
    },

    select: function() {
	if (this.nick == mynickname) {
	    alert("internal dialog?");
	    return;
	}

	this.tab_switch();
	this.badge_clean();
	destination = this.nick;

	if (this.nick == "Channel")
	    return;

	resolve_member_proxy(this.nick);
    },

    badge_inc: function() {
	if (this.button().hasClass('active'))
	    return;

	var badge_num = parseInt(this.badge().text()) || 0;
	this.badge().text(badge_num + 1);
    },

    badge_clean: function() {
	this.badge().text('');
    },

    append_remote_message: function(sender, message) {
	this.badge_inc();
	this.append_message(sender, message);
    },

    append_message: function(sender, message) {
	this.tab().append("<b>{0}:</b> {1}<br/>".format(sender, message));
	widget_animate(this.tab());
    },
});
