# -*- coding: utf-8 -*-

from flask.ext.restful import reqparse, Resource
import flask

from server import api
from server import repository as repo
from server.authentication import requires_auth


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

    @requires_auth
    def get(self, user, beer_id):
        return repo.get_beer(user, beer_id)

    @requires_auth
    def delete(self, user, beer_id):
        repo.delete_beer(user, beer_id)
        return '', 204

    @requires_auth
    def put(self, user, beer_id):
        beer = repo.update_beer(user, beer_id, parser.parse_args())
        return beer, 201

class BeerList(Resource):

    @requires_auth
    def get(self, user):
        return repo.list_beers(user)

    @requires_auth
    def post(self, user):
        beer = parser.parse_args()
        saved_beer = repo.add_beer(user, beer)
        return saved_beer, 201


api.add_resource(BeerList, '/api/<string:user>/beers')
api.add_resource(Beer,     '/api/<string:user>/beers/<string:beer_id>')
