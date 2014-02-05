// -*- mode: js; coding: utf-8 -*-
var chatApp = angular.module('chatApp', []);
chatApp.config(function($logProvider){
  $logProvider.debugEnabled(true);
});

//Controllers
function loginCtrl($scope, loginInfo) {

    $scope.logged = false; //FIXME: Find better name for logged/unlogged state
    $scope.login = function() {
	loginInfo.login($scope.nickname);
	$scope.logged = true;
    }
};
//commented lines are correct code. There are so many things to change , Member
function chatCtrl($scope, $window, Servant, loginInfo) {
    $scope.logged = false;
    $scope.messages = [];
    // $scope.members = {};
    $scope.members = [];
    $scope.show_incomming = true;

    $scope.$on('loginEvent', function(logged, nickname, Member){
	$scope.logged = logged;
	$scope.nickname = nickname;
	$scope.members.push(nickname);
	// $scope.members[nickname] = Member;
    });

    $scope.send_message = function() {
	$scope.messages.push($scope.message);
	// members[destination].proxy.send($scope.nickname, message, private)
	$scope.message = '';
    }
};

//Services
chatApp.service('loginInfo', function($rootScope, $window, $log, Member) {
    return {
	login: function(nickname) {
	    logged = true;
	    // FIXME: chatroom.login is not visible
	    // becouse promise on_adapter_ready is not
	    // $window.chatroom.login($rootScope.nickname)
	    // 	.then(login_success, login_fail)
	    //

	    // function login_success() {
	    // 	chatroom.subscribe(mynickname, room_listener)

	    // 	channel = new Member("Channel", chatroom);
	    // 	channel.select();
	    // 	members['Channel'] = channel;
	    // }
	    $rootScope.$broadcast('loginEvent',nickname, logged); //FIXME: dont broadcast events. Find better way to inform to controllers.
	 }
    };
});

chatApp.factory('Member', function($rootScope, $log){
    function Member(nick, proxy) {
	this.nick = nick;
	this.proxy = proxy;

	var are_you = (nick == nickname) ? " <b>(you)</b>" : "";
	template('member').render(nick, are_you).appendTo('#members');

	if (are_you) return;

	template('incoming').render(nick).appendTo('#notepad');//angular.compile
	$('#incoming-' + nick).hide();
    }

    Member.prototype = {
	destroy: function($index) {
	    $rootScope.members.splice($index,1);
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
	    if (this.nick == $rootScope.nickname) {
		warning("internal dialog is not supported")
		return;
	    }

	    incoming_switch();
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
	    $rootScope.incoming.append("<b>{0}:</b> {1}<br/>".format(sender, message));
	    widget_animate(this.$rootScope.incoming());
	},
    }
    return(Member);
});

chatApp.factory("Servant", function($rootScope, $log) {
    function Servant() {
	$log.debug("constructor del sirviente");
    }

    Servant.prototype = {
	send: function(nick, message, private) {
	    var member = (private) ? nick : "Channel"; //
	    $rootScope.members[member].append_remote_message(nick, message);
	},

	notify_added_member: function(nick) {
	    if (nick in members)
		return;

	    members[nick] = new Member(nick);
	},

	notify_removed_member: function(nick) {
	    destroy_member(nick);
	},
    };
    return(Servant);
});

//non-angular javascript
function wise_application(ws) {
    broker = ws;

    // create an object adapter to register our servant
    ws.createObjectAdapter("WebAdapter")
	.then(on_adapter_ready);

    function on_adapter_ready(adapter) {

	var servant = angular.injector(['ng', 'chatApp'])
	    .invoke(function(Servant, $log) {
		$log.debug("Creating Servant");
		return new Servant();
	    });

	room_listener = adapter.addWithUUID(servant);
	ws.stringToProxy("chat1 -w ws1")
	    .then(on_stringToProxy_response);


	function on_stringToProxy_response(proxy) {
	    chatroom = proxy;
	    ws.ready();

	    return;
	}
    }
}

