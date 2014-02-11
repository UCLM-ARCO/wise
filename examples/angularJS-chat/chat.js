// -*- mode: js; coding: utf-8 -*-
members = {};

var chatApp = angular.module('chatApp', []);
chatApp.config(function($logProvider){
  $logProvider.debugEnabled(true);
});
//AngularJS
//Controllers
function loginCtrl($rootScope, $scope, $log, loginInfo) {
    $scope.logged = false; //FIXME: Find better name for logged/unlogged state
    $scope.login = function() {
	loginInfo.login($scope.nickname);
    };

    $scope.$on('loginSucess', function(event) {
	$scope.logged = true;
    });

    $scope.$on('loginFailed', function(event, error) {
	$scope.$apply(function(){
	    $scope.login_failed = true;
	    $scope.error = error[0];
	});
    });
};

function chatCtrl($scope, $window, $log, Servant, loginInfo, Member) {
    $scope.messages = [];
    $scope.logged = false;
    $scope.members = $window.members;

    $scope.$on('loginSucess', function(event, nickname){
	$log.debug("[chatCtrl] loginSucess: ", nickname);
	$scope.$apply(function() {
	    $scope.logged = true;
	    $scope.nickname = nickname;
	})
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
	    _nickname = nickname;
	    $window.chatroom.login(nickname)
		.then(login_sucess, login_fail);

	    function login_sucess() {
		$log.debug("[loginInfo] loginSucess: ", _nickname);
		$window.chatroom.subscribe(nickname, $window.room_listener);
		$rootScope.$broadcast('loginSucess', _nickname);
	    };

	    function login_fail(error){
		$log.debug("[loginInfo] loginFail: ", error);
		$rootScope.$broadcast('loginFailed', error);
	    }
	 }
    };
});

chatApp.factory('Member', function($log){
    function Member(nick, proxy) {
	$log.debug("[Member] constructor de Member:", nick, proxy);
	this.nick = nick;
	this.proxy = proxy;

    }

    Member.prototype = {
	append_remote_message: function(sender, message) {
	}
    }
    return(Member);
});

chatApp.factory("Servant", function($rootScope, $window, $log, Member) {
    function Servant() {
	$window.members['Channel'] = new Member("Channel", $window.chatroom);
	$log.debug("[Servant] constructor del sirviente:", $window.members, $window.chatroom);
    }

    Servant.prototype = {
	send: function(nick, message) {
	    var member = (private) ? nick : "Channel"; //
	    this.members[member].append_remote_message(nick, message);
	},

	notify_added_member: function(nick) {
	    if (nick in $window.members)
		return;
	    $log.debug("[Servant] notify added member:", members);
	    $rootScope.$apply(function(){
		$window.members[nick] = new Member(nick, $window.chatroom);
	    });
	},

	notify_removed_member: function(nick) {

	    this.members[nick].destroy();
	    delete this.members[nick];
	},
	select: function(nick) {
	    $window.chatroom.get_member(nick)
		.then(on_get_member_response, on_get_member_error)

	    function on_get_member_response(proxy) {
		this.members[nick].proxy = proxy;
	    }
	    function on_get_member_error(error) {
		warning(error);
		destroy_member(nick);
	    }
	}
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
	ws.stringToProxy("chat1 -w ws1")
	    .then(on_stringToProxy_response);

	function on_stringToProxy_response(proxy) {
	    chatroom = proxy;
	    servant = angular.injector(['ng', 'chatApp'])
		.invoke(function(Servant, $log) {
		    $log.debug("[wise_application] Creating Servant");
		    return new Servant();
		});
	    room_listener = adapter.addWithUUID(servant);
	    ws.ready();
	    return;
	}
    }
}