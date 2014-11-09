# -*- coding: utf-8 -*-

from flask import Flask, make_response, jsonify
from flask.ext.restful import Api

from exceptions import KjellerException

class KjellerApi(Api):
    def handle_error(self, e):
        if isinstance(e, KjellerException):
            data = {"message": e.description}
            return self.make_response(data, e.code)

        return super(KjellerApi, self).handle_error(e)


app = Flask(__name__)
api = KjellerApi(app)


@app.errorhandler(404)
def general_page_not_found(e):
    response = jsonify({ "message" : e.description })
    return make_response(response, 404)


import views
