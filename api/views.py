# -*- coding: utf-8 -*-

from api import api, app

from flask.ext.restful import reqparse, abort, Api, Resource
import flask


import shelve

@app.before_request
def before_request():
    flask.g.db = shelve.open('beers.db')

@app.teardown_request
def teardown_request(exception):
    db = getattr(flask.g, 'db', False)
    if db: 
        db.close()

def get_beer(beer_id):
    try:
        return flask.g.db[beer_id]
    except KeyError:
        abort(404, message="No beer found with beer_id {}".format(beer_id))

def delete_beer(beer_id):
    beer_id = str(beer_id) # stop when throwing away shelve
    try:
        del flask.g.db[beer_id]
    except KeyError:
        abort(404, message="No beer with beer_id {} to delete".format(beer_id))

def add_beer(beer):
    bid = next_id()
    beer["beer_id"] = bid
    flask.g.db[bid] = beer
    return flask.g.db[bid]

def update_beer(beer_id, beer):
    beer_id = str(beer_id) # stop when throwing away shelve
    if beer_id not in flask.g.db:
        abort(404, message="No beer found with beer_id {}".format(beer_id))
    flask.g.db[beer_id] = beer

def list_beers():
    return flask.g.db.values()

def next_id():
    ids = [int(beer_id) for beer_id in flask.g.db.keys()]
    return str(max(ids) + 1) if ids else "1"

# deprecated
def abort_if_not_in_cellar(beer_id):
    if beer_id not in flask.g.db:
        abort(404, message="No beer with beer_id {} in the cellar".format(beer_id))        





parser = reqparse.RequestParser()
parser.add_argument('name', 
    type=unicode, 
    location=["json", "values"], 
    required=True)

parser.add_argument('brewery', 
    type=unicode, 
    location=["json", "values"], 
    required=True)

parser.add_argument(
    'count', 
    type=int, 
    location=["json", "values"], 
    required=False, 
    default=1)

class Beer(Resource):
    def get(self, beer_id):
        return get_beer(beer_id)

    def delete(self, beer_id):
        delete_beer(beer_id)
        return '', 204

    def put(self, beer_id):
        beer = parser.parse_args()
        update_beer(beer_id, beer)
        return beer, 201


class BeerList(Resource):
    def get(self):
        return list_beers()

    def post(self):
        beer = parser.parse_args()
        saved_beer = add_beer(beer)
        return saved_beer, 201


api.add_resource(BeerList, '/beers')
api.add_resource(Beer, '/beers/<string:beer_id>')
