// -*- mode: js; coding: utf-8 -*-

//This is jquery way to proceed. There are good ways to do this using angular.
members = {};

function template(name) {
    return $('#TEMPLATES > .' + name).clone().wrap('<p>').parent().html();
}

function widget_animate(widget) {
    widget.stop().animate({ scrollTop: widget[0].scrollHeight }, 800);
};

//AngularJS
//Module
var chatApp = angular.module('chatApp', []);

//Controllers
function loginCtrl($scope, loginInfo) {
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
	$scope.private = false;
	$scope.nickname = nickname;
	$scope.members = $window.members;
	$scope.destination = 'Channel';
    });

    $scope.send = function() {
	var send_info = {source: $scope.nickname,
			destination: $scope.destination}
	var message  = $scope.nickname + ": " + $scope.message;

	$scope.members[send_info.destination].proxy
	    .send(send_info, message)
	    .then(function() {
		$scope.$apply(function (){
		    $scope.messages = $window.members[$scope.destination].private_messages;
		    $scope.message = '';
		});
	    });
    };

    $scope.select = function (member) {
	if(member.nick == $scope.nickname + '<you>')
	    return;
	$scope.destination = member.nick;
	member.new_messages = 0;
	$scope.private = ($scope.destination !== 'Channel');
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
		$rootScope.$apply(function() {
		    $window.chatroom.subscribe(_nickname, $window.room_listener);
		    $rootScope.$broadcast('loginSucess', _nickname);
		});
	    };

	    function login_fail(error){
		$rootScope.$apply(function() {
		    $rootScope.$broadcast('loginFailed', error);
		});
	    }
	}
    };
});

chatApp.factory('Member', function(){
    function Member(nick, proxy) {
	this.nick = (nick !== 'Channel' && nick === _nickname) ? nick + '<you>': nick;
	this.proxy = proxy;
	this.private_messages = [];
	this.new_messages = 0;
    }

    Member.prototype = {
	append: function(message) {
	    this.new_messages++;
	    this.private_messages.push(message);
	},
    }

    return(Member);
});

chatApp.factory("Servant", function($rootScope, $window, Member) {
    function Servant() {
	index = 0;
	$window.members['Channel'] = new Member("Channel", $window.chatroom);
    }

    Servant.prototype = {
	send: function(send_info, message) {
	    $rootScope.$apply(function(){
		var private = (send_info.destination !== 'Channel');
		if(private){
		    var my_self = (send_info.source == _nickname);
		    var member = my_self ? send_info.destination :
			send_info.source;
		    $window.members[member].append(message);
		}
		else{
		    index++;
		    $window.members[send_info.destination].append(message);
		    var html = "<b id=" + index + ">"+ message + "</b> <br />";
		    $("#incoming").append(html);
		    $window.widget_animate($("#incoming"));

		}
	    });
	},

	notify_added_member: function(nick) {
	    $rootScope.$apply(function() {
		if (nick in $window.members)
		    return;
		$window.members[nick] = new Member(nick, $window.chatroom);
	    });
	},

	notify_removed_member: function(nick) {
	    $rootScope.$apply(function() {
		delete $window.members[nick];
		$('#member-' + nick).remove();
	    });
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