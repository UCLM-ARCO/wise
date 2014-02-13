// -*- mode: js; coding: utf-8 -*-

members = {};

var chatApp = angular.module('chatApp', []);
chatApp.config(function($logProvider){
    $logProvider.debugEnabled(true);
});

//AngularJS
//Controllers
function loginCtrl($rootScope, $scope, loginInfo) {
    $scope.login = function() {
	loginInfo.login($scope.nickname);
    };

    $scope.$on('loginSucess', function(event) {
	$scope.logged = true;
    });

    $scope.$on('loginFailed', function(event, error) {
	$scope.login_failed = true;
	$scope.error = error[0];
	$scope.nickname = '';
    });
};

function chatCtrl($scope, $window, Servant, loginInfo, Member) {
    $scope.$on('loginSucess', function(event, nickname){
	$scope.logged = true;
	$scope.nickname = nickname;
	$scope.members = $window.members;
	$scope.messages = $window.members['Channel'].private_messages;
	$scope.destination = 'Channel';
    });

    $scope.send = function() {
	var private = ($scope.destination !== "Channel");
	$scope.members[$scope.destination].proxy
	    .send($scope.nickname, $scope.message, private)
	    .then(function() {
		$scope.message = '';
		$scope.$apply();
	    });
    };

};
//Services
chatApp.service('loginInfo', function($rootScope, $window) {
    return {
	login: function(nickname) {
	    _nickname = nickname;
	    $window.chatroom.login(_nickname)
		.then(login_sucess, login_fail);

	    function login_sucess() {
		$window.chatroom.subscribe(_nickname, $window.room_listener);
		$rootScope.$broadcast('loginSucess', _nickname);
		$rootScope.$apply();
	    };

	    function login_fail(error){
		$rootScope.$broadcast('loginFailed', error);
		$rootScope.$apply();
	    }
	}
    };
});

chatApp.factory('Member', function($rootScope){
    function Member(nick, proxy) {
	this.private_messages = [];
	this.nick = nick;
	this.proxy = proxy;
    }

    Member.prototype = {
	append: function(sender, message) {
	    this.private_messages.push(nick + ": " + message);
	    $rootScope.$apply();
	},
    }

    return(Member);
});

chatApp.factory("Servant", function($rootScope, $window, $log, Member) {
    function Servant() {
	$window.members['Channel'] = new Member("Channel", $window.chatroom);
    }

    Servant.prototype = {
	send: function(sender, message, private) {
	    var destination = (private) ? nick : "Channel";
	    $window.members[destination].append(sender, message);
	    $rootScope.$apply();
	},

	notify_added_member: function(nick) {
	    if (nick in $window.members)
		return;
	    $log.debug("[Servant] notify added member:", members);
	    $window.members[nick] = new Member(nick, $window.chatroom);
	    $rootScope.$apply();
	},

	notify_removed_member: function(nick) {
	    delete $window.members[nick];
	    $rootScope.$apply();

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
	ws.stringToProxy("chat1 -w ws1")
	    .then(on_stringToProxy_response);

	function on_stringToProxy_response(proxy) {
	    chatroom = proxy;
	    servant = angular.injector(['ng', 'chatApp'])
		.invoke(function(Servant) {
		    return new Servant();
		});
	    room_listener = adapter.addWithUUID(servant);
	    ws.ready();

	    return;
	}
    }
}