// -*- mode: js; coding: utf-8 -*-

members = {};

var chatApp = angular.module('chatApp', []);

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
	$scope.destination = 'Channel';
    });

    $scope.send = function() {
	$scope.messages = $window.members[$scope.destination].messages;

	var send_info = {source: $scope.nickname,
			destination: $scope.destination}
	var message  = $scope.nickname + ": " + $scope.message;

	$scope.members[send_info.destination].proxy
	    .send(send_info, message)
	    .then(function() {
		$scope.message = '';
		$scope.$apply();
	    });
    };

    $scope.select = function (member) {
	if(member.nick !== $scope.nickname){
	    $scope.destination = member.nick;
	    member.new_messages = 0;
	    $scope.$apply();
	}
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
	this.nick = nick;
	this.proxy = proxy;
	this.messages = [];
	this.new_messages = 0;
    }

    Member.prototype = {
	append: function(message) {
	    this.new_messages++;
	    this.messages.push(message);
	},
    }

    return(Member);
});

chatApp.factory("Servant", function($rootScope, $window, Member) {
    function Servant() {
	$window.members['Channel'] = new Member("Channel", $window.chatroom);
    }

    Servant.prototype = {
	send: function(send_info, message) {
	    var private = (send_info.destination !== 'Channel');
	    if(private){
		var my_self = (send_info.source == _nickname);
		var member = my_self ? send_info.destination :
		    send_info.source;
		$window.members[member].append(message);
	    }
	    else{
		$window.members[send_info.destination].append(message);
	    }
	    $rootScope.$apply();
	},

	notify_added_member: function(nick) {
	    if (nick in $window.members)
		return;
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