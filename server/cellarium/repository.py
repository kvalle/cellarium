# -*- coding: utf-8 -*-

import re
import os, os.path
from flask.ext.restful import abort
import flask
import shelve

from cellarium import app
from exceptions import BeerNotFoundException

from flask import request
from pprint import pprint as pp

class BeerDB:
    def __init__(self, user):
        self.path = '{}/beers/{}.db'.format(app.config['DB_PATH'], user)

    def __enter__(self):
        self.db = shelve.open(self.path)
        return self.db

    def __exit__(self, type, value, tb):
        self.db.close()


def ucode(string):
    "Hack because shelve dosn't support unicode keys"
    return str(string).encode('utf-8')

def get_beer(user, beer_id):
    try:
        with BeerDB(user) as db:
            return db[ucode(beer_id)]
    except KeyError:
        raise BeerNotFoundException(beer_id)

def delete_beer(user, beer_id):
    beer_id = ucode(beer_id)
    try:
        with BeerDB(user) as db:
            del db[beer_id]
    except KeyError:
        abort(404, message="No beer with beer_id {} to delete".format(beer_id))

def add_beer(user, beer):
    bid = next_id(user)
    beer["beer_id"] = bid
    with BeerDB(user) as db:
        db[bid] = beer
    return beer

def update_beer(user, beer_id, beer):
    beer_id = ucode(beer_id)
    beer["beer_id"] = beer_id

    with BeerDB(user) as db:
        if beer_id not in db:
            abort(404, message="No beer found with beer_id {}".format(beer_id))
        db[beer_id] = beer

    return beer

def remove_all_beers(user):
    db_path = BeerDB(user).path
    if os.path.isfile(db_path):
        os.remove(db_path) 

def list_beers(user):
    with BeerDB(user) as db:
        beers = {beer_id: db[beer_id] for beer_id in db}
    return beers

def next_id(user):
    with BeerDB(user) as db:
        ids = [int(beer_id) for beer_id in db]
    return ucode(max(ids) + 1) if ids else ucode('1')
