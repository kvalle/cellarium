# -*- coding: utf-8 -*-

import flask
from api import app

@app.route('/beer')
def list_beers():
    data = { 
        "items": mock_beers(),
        "count": len(mock_beers())
    }
    return flask.make_response(flask.jsonify(data), 200)

@app.route('/beer/<int:ident>')
def get_beer(ident):
    data = mock_beers()[ident - 1]
    return flask.make_response(flask.jsonify(data), 200)

@app.route('/beer', methods=['POST'])
def add_beer():
    return flask.make_response('', 201)


# Mocks

def mock_beers():
    return [
        {
                    "id": 1,
                    "name": "Dark Horizon 3",
                    "brewery": "Nøgne Ø",
                    "count": 2
        },
        {
                    "id": 2,
                    "name": "Unearthly Oak Aged",
                    "brewery": "Southern Tier",
                    "count": 1
        }
    ]
