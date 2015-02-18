# -*- coding: utf-8 -*-

from flask.ext.restful import reqparse, Resource
import flask

from server import api
from server import repository as repo
from server import authentication as auth


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

    @auth.requires_auth
    def get(self, beer_id):
        user = flask.g.user["username"]
        return repo.get_beer(user, beer_id), 200

    @auth.requires_auth
    def delete(self, beer_id):
        user = flask.g.user["username"]
        repo.delete_beer(user, beer_id)
        return '', 204

    @auth.requires_auth
    def put(self, beer_id):
        user = flask.g.user["username"]
        beer = repo.update_beer(user, beer_id, parser.parse_args())
        return beer, 201

class BeerList(Resource):

    @auth.requires_auth
    def get(self):
        user = flask.g.user["username"]
        return repo.list_beers(user), 200

    @auth.requires_auth
    def post(self):
        beer = parser.parse_args()
        user = flask.g.user["username"]
        saved_beer = repo.add_beer(user, beer)
        return saved_beer, 201


api.add_resource(BeerList, '/api/beers')
api.add_resource(Beer,     '/api/beers/<string:beer_id>')
