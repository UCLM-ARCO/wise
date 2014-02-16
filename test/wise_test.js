describe("commodity function", function() {

    it("bind should fix 'this' property", function() {
	var obj = {
	    method: function() { return this; }
	};

	expect(obj.method()).toBe(obj);

	var method1 = obj.method;
	expect(method1()).not.toBe(obj);

	var method2 = bind(obj, obj.method);
	expect(method2()).toBe(obj);
    });

    it("format works as expected", function() {
	var str = "a {0} string".format("sample")
	expect(str).toBe("a sample string");

	var str = "{0} strings".format(124)
	expect(str).toBe("124 strings");
    });

    it("startsWith works as expected", function() {
	expect("hello".startsWith("")).toBe(true);
	expect("hello".startsWith("h")).toBe(true);
	expect("hello".startsWith("hello")).toBe(true);
	expect("hello".startsWith("helloa")).toBe(false);
	expect("hello".startsWith("bye")).toBe(false);
    });

    it("endsWith works as expected", function() {
	expect("hello".endsWith("")).toBe(false);
	expect("hello".endsWith("o")).toBe(true);
	expect("hello".endsWith("hello")).toBe(true);
	expect("hello".endsWith("ahello")).toBe(false);
	expect("hello".endsWith("bye")).toBe(false);
    });

});

describe("Observable", function() {
    var observer, obj;

    beforeEach(function() {
	observer = { notify: jasmine.createSpy() };
	obj = new Observable();
	obj.attach(observer);
    });

    it("should notify an attached observer", function() {
	obj.notify();
	expect(observer.notify).toHaveBeenCalled();
    });

    it("should ignore a detached observer", function() {
	obj.detach(observer);
	obj.notify();
	expect(observer.notify).not.toHaveBeenCalled();
    });

    it("should pass any param", function() {
	obj.notify(1);
	expect(observer.notify).toHaveBeenCalledWith(1);
	obj.notify(123, 'hi');
	expect(observer.notify).toHaveBeenCalledWith(123, 'hi');
    });
});

describe("Communicator", function() {
    var ws;

    // FIXME: this needs python wise to be launched. Try using a mock
    // for websocket, and then provide whatever it needs

    beforeEach(function() {
	runs(function() {
	    wise.initialize().then(function(ws_) {
		ws = ws_;
	    });
	});

	waitsFor(function() {
	    return ws != undefined;
	}, "communicator to be ready");
    });

    xit("is created correclty", function() {
	expect(ws).toEqual(jasmine.any(wise.Communicator));
    });

});
