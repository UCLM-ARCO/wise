
describe("wise", function() {
    xit("should call former 'onload'", function() {

	var callback = jasmine.createSpy();
	window.onload = callback;

	expect(callback).toHaveBeenCalled();
    });
});

