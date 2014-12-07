# -*- coding: utf-8 -*-

from flask import Flask, make_response, jsonify
from flask.ext.restful import Api

from exceptions import CellariumException


class CellariumApi(Api):
    def handle_error(self, e):
        if isinstance(e, CellariumException):
            data = {"message": e.description}
            return self.make_response(data, e.code)

        return super(CellariumApi, self).handle_error(e)


app = Flask(__name__)
api = CellariumApi(app)


@app.errorhandler(404)
def general_page_not_found(e):
    response = jsonify({ "message" : e.description })
    return make_response(response, 404)

@app.after_request
def after_request(response):
	# Quick hack while developing
    response.headers.add('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
    print response.headers
    return response

import views
