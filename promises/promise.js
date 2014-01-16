// http://promises-aplus.github.io/promises-spec

function create_promise(onFullfilled) {
    var p = new Promise();
    if (onFullfilled == undefined)
	return p;

    return p.then(onFullfilled);
}

Promise = Class.extend({
    then: function(onFulfilled, onRejected) {
	if (this.onFulfilled != undefined || this.onRejected != undefined)
	    throw "Promise.then() already called."

	if (typeof(onFulfilled) === 'function') {
	    this.onFulfilled = onFulfilled;
	}
	if (typeof(onRejected) === 'function') {
	    this.onRejected = onRejected;
	}

	this.chain_promise = new Promise();
	return this.chain_promise;
    },
    resolve: function(retval) {
	var self = this;
	setTimeout(function() {
	    if (self.onFulfilled === undefined) {
		self.chain_promise.resolve(retval);
		return;
	    }

	    try {
		var x = self.onFulfilled(retval);
		if (x != undefined)
		    self.PRP(self.chain_promise, x);
	    } catch (e) {
		self.chain_promise.reject(e);
	    }
	}, 0);
    },
    reject: function(error) {
	var self = this;
	setTimeout(function() {
	    if (self.onRejected === undefined) {
		self.chain_promise.reject(error);
		return;
	    }

	    try {
		var x = self.onRejected(error);
		if (x != undefined)
		    self.PRP(self.chain_promise, x);
	    } catch (e) {
		self.chain_promise.reject(e);
	    }
	}, 0);
    },
    PRP: function(promise, x) {
	if (promise === x) {
	    promise.reject("TypeError");
	    return;
	}

	// If x is a promise, adopt its state [3.4]:
	if (typeof(x) === 'Promise') {
	    x.then(promise.resolve, promise.reject);
	    return;
	}

	// If x is not an object or function, fulfill promise with x.
	if (typeof(x) != 'function' && typeof(x) != 'object') {
	    promise.resolve(x);
	    return;
	}

	// if x is an object or function
	try {
	    var then = x.then;
	} catch (e) {
	    promise.reject(e);
	    return;
	}

	if (typeof(then) != 'function') {
	    promise.resolve(x);
	    return;
	}

	var resolved = false;
	try {
	    bind(x, then)(resolvePromise, rejectPromise);
	} catch(e) {
	    if (!resolved) {
		promise.reject(e);
		resolved = true;
	    }
	    return;
	}

	function resolvePromise(y) {
	    if (!resolved)
		PRP(promise, y);
	    resolved = true;
	}
	function rejectPromise(r) {
	    if (!resolved)
		promise.reject(r);
	    resolved = true;
	}
    }
});

// https://github.com/cujojs/when/blob/master/when.js
function map(array, callable) {
    var promise = new Promise();
    var results = [];
    var len = array.length;

    for (var i in array) {
	resolveOne(array[i], i);
    }

    function resolveOne(item, i) {
	cast(item).then(callable).then(function(retval) {
	    results[i] = retval;
	    if (!--len)
		promise.resolve(results);
	});
    }

    return promise;

    function cast(x) {
        if (x instanceof Promise)
	    return x;

	var p = new Promise();
	p.resolve(x);
	return p.then(identity);
    }
};

function all(array) {
    return map(array, identity);
}

function identity(x) {
    return x;
}


describe("A promise", function() {
    var promise;
    var fullfill;
    var reject;

    beforeEach(function() {
	promise = new Promise();
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

    it("map 2 promises", function() {
	var p0 = new Promise();
	var p1 = new Promise();

	var promise_vector = [
	    p0.then(jasmine.createSpy().andReturn(2)),
	    p1.then(jasmine.createSpy().andReturn(3)),
	]

	function add2(v) {
	    return v + 2;
	}

	map(promise_vector, add2).then(fullfill);

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
});


describe("map", function() {
    var fullfill;

    beforeEach(function() {
	fullfill = jasmine.createSpy();
    });

    it("should accept 2 promises", function() {
	var p0 = new Promise();
	var p1 = new Promise();

	var promise_vector = [
	    p0.then(jasmine.createSpy().andReturn(2)),
	    p1.then(jasmine.createSpy().andReturn(3)),
	]

	function add2(v) {
	    return v + 2;
	}

	map(promise_vector, add2).then(fullfill);

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
	var p0 = new Promise();
	var p1 = new Promise();

	var array = [
	    p0.then(jasmine.createSpy().andReturn(2)),
	    p1.then(jasmine.createSpy().andReturn(3)),
	    6,
	]

	function add2(v) {
	    return v + 2;
	}

	map(array, add2).then(fullfill);

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
	var p0 = new Promise();
	var p1 = new Promise();
	var promise_vector = [p0, p1];

	all(promise_vector).then(fullfill);

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
	var p0 = new Promise();
	var p1 = new Promise();
	var promise_vector = [p0, p1, 1];

	all(promise_vector).then(fullfill);

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
});
