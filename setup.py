#!/usr/bin/python
# -*- mode: python; coding: utf-8 -*-

from distutils.core import setup

setup(name = 'python-wise',
      version = '0.1',
      packages = ['wise', 'chromehandler'],
      package_data = {'wise': ['js/*'],
                      'chromehandler': ['chromedriver-xvfb.sh']},
      )
