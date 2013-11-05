# -*- mode: makefile-gmake; coding: utf-8 -*-

all:

.PHONY: test
test:
	@for t in test/*.py; do \
	    echo "running test: $$t"; \
	    xvfb-run -s "-screen 0 1600x1200x24" nosetests -s $$t; \
	done


.PHONY: test-together
test-together:
	find test -name "_test.py" | xargs nosetests -s


.PHONY: clean
clean:
	find . -name "*.pyc" -delete
	find . -name "*~" -delete
	find . -name "*.log" -delete
	$(RM) -rfv dist MANIFEST WiseSaver.db

