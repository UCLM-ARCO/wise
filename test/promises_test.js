describe("A promise", function() {
    var promise;
    var fullfill;
    var reject;

    beforeEach(function() {
	promise = new wise.Promise();
	fullfill = jasmine.createSpy();
	reject = jasmine.createSpy();
    });

    it("(only with onFullfilled) should call resolved", function() {
	promise.then(fullfill);

	runs(function() {
	    promise.resolve(4);
	});

	waitsFor(function() {
	    return fullfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fullfill).toHaveBeenCalledWith(4);
	});
    });

    it("resolve without then()", function() {
	promise.resolve();
    });

    it("should call fullfill if resolved before call then()", function() {
	runs(function() {
	    promise.resolve(4);
	    promise.then(fullfill);
	});

	waitsFor(function() {
	    return fullfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fullfill).toHaveBeenCalledWith(4);
	});
    });

    it("(only with onReject) should call rejected if fails", function() {
	promise.then(undefined, reject);

	runs(function() {
	    promise.reject("error");
	});

	waitsFor(function() {
	    return reject.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(reject).toHaveBeenCalledWith("error");
	});
    });

    it("(chained) should resolve second promise", function() {
	promise2 = promise.then();
	promise2.then(fullfill);

	runs(function() {
	    promise.resolve(4);
	});

	waitsFor(function() {
	    return fullfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fullfill).toHaveBeenCalledWith(4);
	});
    });

    it("(chained) add 2 numbers", function() {
	var just_return_5 = jasmine.createSpy().andReturn(5);

	promise2 = promise.then(just_return_5);
	promise2.then(fullfill);

	runs(function() {
	    promise.resolve(1);
	});

	waitsFor(function() {
	    return fullfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fullfill).toHaveBeenCalledWith(5);
	});
    });
});


describe("map", function() {
    var fullfill;

    beforeEach(function() {
	fullfill = jasmine.createSpy();
    });

    it("should accept 2 promises", function() {
	var p0 = new wise.Promise();
	var p1 = new wise.Promise();

	var promise_vector = [
	    p0.then(jasmine.createSpy().andReturn(2)),
	    p1.then(jasmine.createSpy().andReturn(3)),
	]

	function add2(v) {
	    return v + 2;
	}

	wise.map(promise_vector, add2).then(fullfill);

	runs(function() {
	    p0.resolve();
	    p1.resolve();
	});

	waitsFor(function() {
	    return fullfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fullfill).toHaveBeenCalledWith([4, 5]);
	});
    });

    it("should accept 2 promises and 1 value", function() {
	var p0 = new wise.Promise();
	var p1 = new wise.Promise();

	var array = [
	    p0.then(jasmine.createSpy().andReturn(2)),
	    p1.then(jasmine.createSpy().andReturn(3)),
	    6,
	]

	function add2(v) {
	    return v + 2;
	}

	wise.map(array, add2).then(fullfill);

	runs(function() {
	    p0.resolve();
	    p1.resolve();
	});

	waitsFor(function() {
	    return fullfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fullfill).toHaveBeenCalledWith([4, 5, 8]);
	});
    });
});

describe("all", function() {
    var fullfill;

    beforeEach(function() {
	fullfill = jasmine.createSpy();
    });

    it("should accept 2 promises", function() {
	var p0 = new wise.Promise();
	var p1 = new wise.Promise();
	var promise_vector = [p0, p1];

	wise.all(promise_vector).then(fullfill);

	runs(function() {
	    p0.resolve(0);
	    p1.resolve(0);
	});

	waitsFor(function() {
	    return fullfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fullfill).toHaveBeenCalled();
	});
    });

    it("should accept 2 promises and 1 value", function() {
	var p0 = new wise.Promise();
	var p1 = new wise.Promise();
	var promise_vector = [p0, p1, 1];

	wise.all(promise_vector).then(fullfill);

	runs(function() {
	    p0.resolve(0);
	    p1.resolve(0);
	});

	waitsFor(function() {
	    return fullfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fullfill).toHaveBeenCalled();
	});
    });

    // promise.resolve(undefined)

    // promise without then
});
