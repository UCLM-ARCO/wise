// -*- mode: js; coding: utf-8 -*-
var chatApp = angular.module('chatApp', []);
chatApp.config(function($logProvider){
  $logProvider.debugEnabled(true);
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

//AngularJS
//Controllers
function loginCtrl($scope, loginInfo) {

    $scope.logged = false; //FIXME: Find better name for logged/unlogged state
    $scope.login = function() {
	loginInfo.login($scope.nickname);
	$scope.logged = true;
    }
};

//commented lines are correct code. There are so many things to change
function chatCtrl($scope, $window, Servant, loginInfo, Member) {
    $scope.logged = false;
    $scope.messages = [];
    $scope.members = {};

    $scope.$on('loginEvent', function(event, nickname, logged){
	$scope.logged = logged;
	$scope.nickname = nickname;
	var channel = new Member("Channel", $window.chatroom);
	$scope.members['Channel'] = channel;
    });

    $scope.send_message = function() {
	$scope.messages.push($scope.message);
	$scope.message = '';
    }
};

//Services
chatApp.service('loginInfo', function($rootScope, $window, $log) {
    return {
	login: function(nickname) {
	    logged = true;
	    $window.chatroom.login(nickname)
		.then(login_sucess, login_fail);

	    function login_sucess() {
		$window.chatroom.subscribe(nickname, $window.room_listener);
	    };

	    function login_fail(error){
		$log.debug("Login failed");
	    }

	    $rootScope.$broadcast('loginEvent',nickname, logged);
	 }
    };
});

chatApp.factory('Member', function($rootScope, $log){
    function Member(nick, proxy) {
	this.nick = nick;
	this.proxy = proxy;
    }

    Member.prototype = {
	append_remote_message: function(sender, message) {
	}
    }
    return(Member);
});

chatApp.factory("Servant", function($rootScope, $log) {
    function Servant() {
	$log.debug("constructor del sirviente");
    }

    Servant.prototype = {
	send: function(nick, message) {
	    var member = (private) ? nick : "Channel"; //
	    $rootScope.members[member].append_remote_message(nick, message);
	},

	notify_added_member: function(nick) {
	    if (nick in $rootScope.members)
		return;
	    $rootScope.members[nick] = new Member(nick, $window.chatroom);
	},

	notify_removed_member: function(nick) {
	    $rootScope.members[nick].destroy();
	    delete $rootScope.members[nick];
	},
    };
    return(Servant);
});

