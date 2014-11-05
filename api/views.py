# -*- coding: utf-8 -*-

from api import api
from flask.ext.restful import reqparse, abort, Api, Resource

# repo

BEERS = {
        1: {
                    "id": 1,
                    "name": "Dark Horizon 3",
                    "brewery": "Nøgne Ø",
                    "count": 2
        },
        2: {
                    "id": 2,
                    "name": "Unearthly Oak Aged",
                    "brewery": "Southern Tier",
                    "count": 1
        }
    }

def abort_if_not_in_cellar(beer_id):
    if beer_id not in BEERS:
        abort(404, message="No beer with beer_id {} in the cellar".format(beer_id))

# resources

parser = reqparse.RequestParser()
parser.add_argument('name', type=str) # moar here

class Beer(Resource):
    def get(self, beer_id):
        abort_if_not_in_cellar(beer_id)
        return BEERS[beer_id]

    def delete(self, beer_id):
        abort_if_not_in_cellar(beer_id)
        del BEERS[beer_id]
        return '', 204

    def put(self, beer_id):
        args = parser.parse_args()
        beer = {'name': args['name']}
        BEERS[beer_id] = beer
        return beer, 201


class BeerList(Resource):
    def get(self):
        return BEERS

    def post(self):
        args = parser.parse_args()
        beer_id = len(BEERS) + 1
        BEERS[beer_id] = {'name': args['name']}
        return BEERS[beer_id], 201

# views

api.add_resource(BeerList, '/beers')
api.add_resource(Beer, '/beers/<int:beer_id>')
