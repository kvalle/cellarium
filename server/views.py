# -*- coding: utf-8 -*-

from flask.ext.restful import reqparse, Resource
import flask

from server import api
from server import repository as repo

parser = reqparse.RequestParser()
parser.add_argument('name', 
    type=unicode, 
    location=["json", "values"], 
    required=True)

parser.add_argument('brewery', 
    type=unicode, 
    location=["json", "values"], 
    required=True)

parser.add_argument('count',
    type=int, 
    location=["json", "values"], 
    required=False, 
    default=1)

parser.add_argument('vintage',
    type=int, 
    location=["json", "values"], 
    required=True)


class Beer(Resource):
    def get(self, beer_id):
        return repo.get_beer(beer_id)

    def delete(self, beer_id):
        repo.delete_beer(beer_id)
        return '', 204

    def put(self, beer_id):
        beer = repo.update_beer(beer_id, parser.parse_args())
        return beer, 201


class BeerList(Resource):
    def get(self):
        return repo.list_beers()

    def post(self):
        beer = parser.parse_args()
        saved_beer = repo.add_beer(beer)
        return saved_beer, 201


api.add_resource(BeerList, '/api/beers')
api.add_resource(Beer, '/api/beers/<string:beer_id>')
