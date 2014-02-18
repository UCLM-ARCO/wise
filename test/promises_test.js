describe("A promise", function() {
    var promise;
    var fulfill;
    var reject;

    beforeEach(function() {
	promise = new wise.Promise();
	fulfill = jasmine.createSpy();
	reject = jasmine.createSpy();
    });

    it("(only with onFulfilled) should call resolved", function() {
	promise.then(fulfill);

	runs(function() {
	    promise.resolve(4);
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalledWith(4);
	});
    });

    it("resolve(undefined) resolve chain promise", function() {
	promise.then(fulfill);

	runs(function() {
	    promise.resolve();
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalledWith(undefined);
	});

    });

    it("resolve without then()", function() {
	promise.resolve();
    });

    it("should call fulfill if resolved before call then()", function() {
	runs(function() {
	    promise.resolve(4);
	    promise.then(fulfill);
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalledWith(4);
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
	promise2.then(fulfill);

	runs(function() {
	    promise.resolve(4);
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalledWith(4);
	});
    });

    it("(chained) resolved with first fulfill retval", function() {
	var just_return_5 = jasmine.createSpy().andReturn(5);

	promise2 = promise.then(just_return_5);
	promise2.then(fulfill);

	runs(function() {
	    promise.resolve(1);
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalledWith(5);
	});
    });

    it("should raise error on twice resolve", function() {
	var a = function() {
	    promise.resolve();
	    promise.resolve();
	};

	runs(function() {
	    expect(a).toThrow();
	});
    });

    it("should raise error on twice reject", function() {
	var a = function() {
	    promise.reject();
	    promise.reject();
	};

	runs(function() {
	    expect(a).toThrow();
	});
    });

    it("should raise error on resolve and reject", function() {
	var f = function() {
	    promise.resolve();
	    promise.reject();
	};

	runs(function() {
	    expect(f).toThrow();
	});
    });

    it("should support 2 then", function() {
	var fulfill0 = jasmine.createSpy();
	var fulfill1 = jasmine.createSpy();

	p0 = promise.then();
	p0.then(fulfill0);

	p1 = promise.then();
	p1.then(fulfill1);

	runs(function() {
	    promise.resolve();
	});

	waitsFor(function() {
	    return fulfill0.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill0).toHaveBeenCalled();
	    expect(fulfill1).toHaveBeenCalled();
	});
    });
});


describe("map", function() {
    var fulfill;

    beforeEach(function() {
	fulfill = jasmine.createSpy();
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

	wise.map(promise_vector, add2).then(fulfill);

	runs(function() {
	    p0.resolve();
	    p1.resolve();
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalledWith([4, 5]);
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

	wise.map(array, add2).then(fulfill);

	runs(function() {
	    p0.resolve();
	    p1.resolve();
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalledWith([4, 5, 8]);
	});
    });
});

describe("all", function() {
    var fulfill;

    beforeEach(function() {
	fulfill = jasmine.createSpy();
    });

    it("should accept 2 promises", function() {
	var p0 = new wise.Promise();
	var p1 = new wise.Promise();
	var promise_vector = [p0, p1];

	wise.all(promise_vector).then(fulfill);

	runs(function() {
	    p0.resolve(0);
	    p1.resolve(0);
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalled();
	});
    });

    it("should accept 2 promises and 1 value", function() {
	var p0 = new wise.Promise();
	var p1 = new wise.Promise();
	var promise_vector = [p0, p1, 1];

	wise.all(promise_vector).then(fulfill);

	runs(function() {
	    p0.resolve(0);
	    p1.resolve(0);
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalled();
	});
    });

    it("should activated with resolve()", function() {
	var p0 = new wise.Promise();
	var p1 = new wise.Promise();

	wise.all([p0, p1]).then(fulfill);

	runs(function() {
	    p0.resolve();
	    p1.resolve();
	});

	waitsFor(function() {
	    return fulfill.calls.length > 0;
	}, "function to be called", 100);

	runs(function() {
	    expect(fulfill).toHaveBeenCalled();
	});
    });

    // promise without then
});
