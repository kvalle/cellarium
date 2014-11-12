# -*- coding: utf-8 -*-

from flask.ext.restful import abort
import flask
import shelve

from api import app
from exceptions import BeerNotFoundException

@app.before_request
def before_request():
    flask.g.db = shelve.open('beers.db')

@app.teardown_request
def teardown_request(exception):
    db = getattr(flask.g, 'db', False)
    if db: 
        db.close()


def ucode(string):
    "Hack because shelve dosn't support unicode keys"
    return str(string).encode('utf-8')

def get_beer(beer_id):
    print "getting " + str(beer_id)
    try:
        return flask.g.db[ucode(beer_id)]
    except KeyError:
        raise BeerNotFoundException(beer_id)

def delete_beer(beer_id):
    beer_id = ucode(beer_id)
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
    beer_id = ucode(beer_id)
    beer["beer_id"] = beer_id
    if beer_id not in flask.g.db:
        abort(404, message="No beer found with beer_id {}".format(beer_id))
    flask.g.db[beer_id] = beer
    return beer

def list_beers():
    return flask.g.db.values()

def next_id():
    ids = [int(beer_id) for beer_id in flask.g.db.keys()]
    return ucode(max(ids) + 1) if ids else ucode('1')
