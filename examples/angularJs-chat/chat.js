// -*- mode: js; coding: utf-8 -*-
var chatApp = angular.module('chat', []);

// chatApp.run(["$rootScope",function($rootScope, ws) {
//     broker = ws;
//     members = {};

//     // create an object adapter to register our servant
//     ws.createObjectAdapter("WebAdapter")
// 	.on_response(on_adapter_ready);

//     function on_adapter_ready(adapter) {
// 	room_listener = adapter.addWithUUID(new Servant());

// 	ws.stringToProxy("chat1 -w ws1")
// 	    .on_response(on_stringToProxy_response);

// 	function on_stringToProxy_response(proxy) {
// 	    chatroom = proxy;
// 	    set_UI_callbacks();
// 	    ws.ready();

// //	    return;
// //	    autologin();
// 	}
//     }
// }]);

function loginCtrl($scope, loginInfo) {
    $scope.logged = false; //FIXME: Find better name for logged/unlogged state

    $scope.login = function() {
	loginInfo.login($scope.nickname);
	$scope.logged = true;
    }
};

function chatCtrl($scope, loginInfo) {
    $scope.logged = false;
    $scope.messages = [];

    $scope.$on('loginEvent', function(logged, nickname){
	$scope.logged = logged;
	$scope.nickname = nickname;
    });

    $scope.send_message = function() {
	$scope.messages.push($scope.message);
	$scope.message = '';
    }
};

chatApp.service('loginInfo', function($rootScope) {
    return {
	login: function(nickname) {
	    logged = true;
	    nickname = nickname;
	    $rootScope.$broadcast('loginEvent', nickname, logged);
	}
    };
});


// Servant = Class.extend({
//     send: function(nick, message, private) {
// 	var member = (private) ? nick : "Channel";
// 	members[member].append_remote_message(nick, message);
//     },

//     notify_added_member: function(nick) {
// 	members[nick] = new Member(nick);
//     },

//     notify_removed_member: function(nick) {
// 	// FIXME: never called
// 	// destroy_member(nick);
//     },
// });

// chatApp.factory('Member'.factory($scope) {
//     function Member(nick, proxy) {
// 	this.nick = nick;
// 	this.proxy = proxy;

// 	var are_you = (nick == $scope.mynickname) ? " <b>(you)</b>" : "";

// 	template('member').render(nick, are_you).appendTo('#members');

// 	if (are_you) return;

// 	template('incoming').render(nick).appendTo('#notepad');
//     },

//     destroy: function() {
// 	this.tab().remove();
// 	$('#member-' + this.nick).remove();
//     },

//     tab: function() {
// 	return $("#incoming-" + this.nick);
//     },

//     button: function() {
// 	return $("#member-" +  this.nick);
//     },

//     badge: function() {
// 	return $('#member-{0} > .badge'.format(this.nick));
//     },

//     tab_switch: function() {
// 	$('#notepad div').hide();
// 	this.tab().show();

// 	$('#members a').removeClass('active');
// 	this.button().addClass("active");
//     },

//     select: function() {
// 	if (this.nick == mynickname) {
// 	    alert("internal dialog?");
// 	    return;
// 	}

// 	this.tab_switch();
// 	this.badge_clean();
// 	destination = this.nick;

// 	if (this.nick == "Channel")
// 	    return;

// 	resolve_member_proxy(this.nick);
//     },

//     badge_inc: function() {
// 	if (this.button().hasClass('active'))
// 	    return;

// 	var badge_num = parseInt(this.badge().text()) || 0;
// 	this.badge().text(badge_num + 1);
//     },

//     badge_clean: function() {
// 	this.badge().text('');
//     },

//     append_remote_message: function(sender, message) {
// 	this.badge_inc();
// 	this.append_message(sender, message);
//     },

//     append_message: function(sender, message) {
// 	this.tab().append("<b>{0}:</b> {1}<br/>".format(sender, message));
// 	widget_animate(this.tab());
//     },
// });
