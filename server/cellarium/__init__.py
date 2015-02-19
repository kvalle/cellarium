# -*- coding: utf-8 -*-

import os

from flask import Flask, make_response, jsonify
from flask.ext.restful import Api

from exceptions import CellariumException

class CellariumApi(Api):
    def handle_error(self, e):
        if isinstance(e, CellariumException):
            data = {"message": e.description}
            return self.make_response(data, e.code)

        return super(CellariumApi, self).handle_error(e)


if not os.environ.get('CELLARIUM_HOME'):
	raise "Error: CELLARIUM_HOME is not set."

app = Flask("Cellarium")
if os.environ.get('CELLARIUM_CONFIG'):
    app.config.from_envvar('CELLARIUM_CONFIG')
else:
    print " * CELLARIUM_CONFIG is not set, running with default config"
    app.config.from_pyfile(os.environ.get('CELLARIUM_HOME') + "/cellarium/config.cfg")

api = CellariumApi(app)


@app.errorhandler(404)
def general_page_not_found(e):
    response = jsonify({ "message" : e.description })
    return make_response(response, 404)


import authentication
import views
