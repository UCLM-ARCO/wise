# -*- mode: makefile-gmake; coding: utf-8 -*-

all:

.PHONY: test
test:
	@for t in test/*.py; do \
	    echo "running test: $$t"; \
	    prego $$t; \
	done

.PHONY: clean
clean:
	find . -name "*.pyc" -delete
	find . -name "*~" -delete
