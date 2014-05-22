// -*- mode: js; coding: utf-8 -*-

var channel_id = "Channel";
var chat = angular.module('chat', ['ngAnimate']);

chat.factory("RoomListener", function($rootScope) {
    return Class.extend({
	send: function(nick, message, is_private) {
	    $rootScope.$apply(function() {
		var member = is_private ? nick : channel_id;
		$rootScope.members[member].new_message(nick, message);
	    });
	},

	notify_added_member: function(nick) {
	    $rootScope.$apply(function() {
		if (nick === $rootScope.my_nick)
		    return;

		if (! (nick in $rootScope.members)) {
		    var member = new Member(nick);
		    $rootScope.members[nick] = member;
		    member.resolve_proxy();
		}
	    });
	},

	notify_removed_member: function(nick) {
	    $rootScope.$apply(function() {
		if (nick in $rootScope.members)
		    delete $rootScope.members[nick]

		if (nick == $rootScope.current_member.nick)
		    $rootScope.select_member($rootScope.members[channel_id]);
	    });
	},
    });
});


// NOTE: this is not part of the controlle, is a new directive added
// here for simplicity

chat.directive('scrollOnDone', function() {
    return function(scope, elements, attrs) {
	widget = $(elements[0]).parent();
	widget.stop().animate({ scrollTop: widget[0].scrollHeight }, 800);
    }
});


Member = Class.extend({
    init: function(nick) {
	this.nick = nick;
	this.messages = [];
	this.selected = false;
	this.proxy = chatroom;
	this.new_message_count = 0;
    },

    select: function(selected) {
	this.selected = selected;
	if (selected)
	    this.new_message_count = 0;
    },

    resolve_proxy: function() {
	var self = this;
	chatroom.get_member(this.nick).then(
	    function(proxy) {
		self.proxy = proxy;
	    },

	    function(error) {
		// FIXME: issue a warning and remove member
		log.error("resolving proxy of member {0}".format(self.nick));
	    });
    },

    new_message: function(sender, message) {
	this.messages.push({sender: sender, content: message});
	if (!this.selected)
	    this.new_message_count++;
    },
});

function loginCtrl($rootScope, $scope) {
    $rootScope.members = {};

    $rootScope.clear_error = function() { $rootScope.error_log = ""; }
    $rootScope.clear_warning = function() { $rootScope.warning_log = ""; }

    $rootScope.clear_log = function() {
	this.clear_error();
	this.clear_warning();
    };



    $scope.login = function(nick) {
	$rootScope.my_nick = nick;
	chatroom.login(nick).then(on_login_success, on_login_fail);

	function on_login_success() {
	    chatroom.subscribe(nick, room_listener);
	    $scope.$apply(function () {
	     	$rootScope.logged = true;

	     	var channel = new Member(channel_id);
		channel.select(true);
		$rootScope.members[channel_id] = channel;
		$rootScope.current_member = channel;
		$rootScope.clear_log();
	    });
	};

	function on_login_fail(e) {
	    $scope.$apply(function () {
		var msg = "login failed for user '{0}': {1}".format(e.message, e.name);
		$rootScope.error_log = msg;
		log.error(msg);
	    });
	};
    }
};

function chatCtrl($rootScope, $scope) {
    $rootScope.select_member = function(member) {
	if (member.nick == $rootScope.my_nick) {
	    $rootScope.warning_log = "internal dialog is not supported";
	    return;
	}

	$rootScope.current_member.select(false);
	$rootScope.current_member = member;
	member.select(true);
    };

    $scope.send_message = function() {
	var dest = $rootScope.current_member;
	var is_private = dest.nick !== channel_id;

	dest.proxy.send($rootScope.my_nick, $scope.message, is_private)
	    .catch(function(error) {
		var msg = "sending message to '{0}'".format(dest.nick);
		$rootScope.error_log = msg;
		log.error(msg, error);
		$rootScope.$digest();
	    });

	if (dest.nick !== channel_id)
	    dest.new_message($rootScope.my_nick, $scope.message);

	$scope.message = "";
    };
};

function wise_application(ws) {
    log.set_level(1);

    ws.createObjectAdapter("Adapter")
	.then(on_adapter_ready);

    function on_adapter_ready(adapter) {
	var injector = angular.element(document).injector();
	injector.invoke(function(RoomListener) {
	    var servant = new RoomListener();
	    room_listener = adapter.addWithUUID(servant);
	});
    };

    ws.stringToProxy("chat1 -w ws1")
	.then(function(proxy) {
	    chatroom = proxy;
	});
};




    // $rootScope.error_log = "errororor";
    // setTimeout(function() {
    // 	$scope.$apply(function () {
    //  	    $rootScope.error_log = "";
    // 	});
    // }, 1000);
