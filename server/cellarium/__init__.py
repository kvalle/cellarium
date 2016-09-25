# -*- coding: utf-8 -*-

import os

from flask import Flask, make_response, jsonify
from flask.ext.restful import Api

from exceptions import CellariumException

app = Flask("Cellarium")

class CellariumApi(Api):
    def handle_error(self, e):
        if isinstance(e, CellariumException):
            data = {"message": e.description}
            app.logger.warn("Cellarium error: %s", e.description)
            return self.make_response(data, e.code)

        return super(CellariumApi, self).handle_error(e)


if not os.environ.get('CELLARIUM_HOME'):
    msg = """
    CELLARIUM_HOME is not set.
    You can solve this by setting the following environment variable:

        export CELLARIUM_HOME='/path/to/folder/with/cellarium/module'
    """
    raise Exception(msg)

if os.environ.get('CELLARIUM_CONFIG'):
    app.config.from_envvar('CELLARIUM_CONFIG')
else:
    app.logger.info(" * CELLARIUM_CONFIG is not set, running with default config")
    app.config.from_pyfile(os.environ.get('CELLARIUM_HOME') + "/cellarium/config.cfg")

api = CellariumApi(app)


@app.errorhandler(404)
def general_page_not_found(e):
    response = jsonify({ "message" : e.description })
    return make_response(response, 404)


import logs
import authentication
import views

app.logger.info("Application started")
