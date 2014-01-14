# -*- mode: makefile-gmake; coding: utf-8 -*-

define rm-r
  $(eval files = $(foreach pattern,$(1),$(shell find . -name "$(pattern)")))
  $(RM) -v $(files)
endef

all:

marsha:
	for i in $(shell seq 1 5); do \
		nosetests test/marshalling_test.py:TestMarshalling_FromServerToBrowser; \
	done


.PHONY: test
test:
	@for t in test/*.py; do \
	    echo "running test: $$t"; \
	    xvfb-run -s "-screen 0 1600x1200x24" nosetests -vs $$t; \
	done


.PHONY: test-together
test-together:
	find test -name "_test.py" | xargs nosetests -s


.PHONY: clean
clean:
	$(call rm-r, *.pyc *~ *.log wise.db)
	$(RM) -rv dist MANIFEST
