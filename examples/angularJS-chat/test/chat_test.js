'use strict';

describe("A chat that use wise", function(){
    it("call ws.ready()", function() {
	expect(ws_ready).toBe(true);
    });

    beforeEach(module("chatApp"));

    describe("when login", function() {
	var scope, chatCtr, loginCtrl;
	beforeEach(inject(function($rootScope, $controller){
	    scope = $rootScope.$new();
	    loginCtrl = $controller('loginCtrl',{
		$scope: scope
	    })
	}));

	it("should show the chat", function() {
	    console.log(loginCtrl);
	    loginCtrl.$scope.loginCtrl.login("user");
	    expect(scope.logged).toBe(true);
	});
    })
});