# -*- mode: makefile-gmake; coding: utf-8 -*-

define rm-r
  $(eval files = $(foreach pattern,$(1),$(shell find . -name "$(pattern)")))
  $(RM) -v $(files)
endef

all:

.PHONY: test
test:
	@for t in test/*.py; do \
	    echo "running test: $$t"; \
	    nosetests -vs $$t; \
	done

 #	    xvfb-run -s "-screen 0 1600x1200x24" nosetests -vs $$t; \

karma-single:
	karma start test/karma.conf.js --single-run

karma:
	karma start test/karma.conf.js

release:
	python setup.py sdist upload

.PHONY: clean
clean:
	$(call rm-r,*.pyc *~ *.log wise.db)
	$(RM) -rv dist MANIFEST
