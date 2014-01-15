// http://promises-aplus.github.io/promises-spec

Promise = Class.extend({
    then: function(onFulfilled, onRejected) {
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
	self = this;
	setTimeout(function() {
	    if (self.onFulfilled === undefined) {
		self.chain_promise.resolve(retval);
		return;
	    }

	    try {
		var x = self.onFulfilled(retval);
		if (x != undefined)
		    PRP(self.chain_promise, x);
	    } catch (e) {
		self.chain_promise.reject(e);
	    }
	}, 0);
    },
    reject: function(error) {
	self = this;
	setTimeout(function() {
	    if (self.onRejected === undefined) {
		self.chain_promise.reject(error);
		return;
	    }

	    try {
		var x = self.onRejected(error);
		if (x != undefined)
		    PRP(self.chain_promise, x);
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
	if (typeof(x) === 'Promise') {
	    x.then(promise.resolve, promise.reject);  // FIXME: "promise" or this??
	    return;
	}
	if (typeof(x) != 'function') {
	    promise.resolve(x);
	    return;
	}

	try {
	    var then = x.then;
	} catch (e) {
	    promise.reject(e);
	}
	if (typeof(then) != 'function') {
	    promise.resolve(x);
	}

	try {
	    bind(x, then)(resolvePromise, rejectPromise);
	} catch(e) {
	    // FIXME: ignore if callbacks were invoked
	    promise.reject(e);
	}

	// FIXME: only a call
	function resolvePromise(y) {
	    PRP(promise, y);
	}
	function rejectPromise(r) {
	    promise.reject(r);
	}
    }
});

// then_resolve_only();
// then_reject();
chain();

function then_resolve() {
    var promise = new Promise();
    promise.then(fullfilled, rejected);
    promise.resolve(4);
}

function then_resolve_only() {
    var promise = new Promise();
    promise.then(fullfilled);
    promise.resolve(4);
}

function then_reject() {
    var promise = new Promise();
    promise.then(fullfilled, rejected);
    promise.reject("bad");
}

function chain() {
    var promise1 = new Promise();
    var promise2 = promise1.then(fullfilled, rejected);
    promise2.then(fullfilled2);
    promise1.resolve(4);
}

function fullfilled(retval) {
    _("fulfilled:", retval);
    return retval + 1;
}

function fullfilled2(retval) {
    _("fulfilled2:", retval);
}

function rejected(error) {
    _("rejected:", error);
}
