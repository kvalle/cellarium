from flask import Flask, make_response
import os

app = Flask(__name__)

@app.errorhandler(404)
def page_not_found(e):
    return make_response('', 404)

import views
