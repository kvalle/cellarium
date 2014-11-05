from flask import Flask, make_response
from flask.ext import restful

import os

app = Flask(__name__)
api = restful.Api(app)

@app.errorhandler(404)
def page_not_found(e):
    return make_response('', 404)

import views
