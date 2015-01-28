# -*- coding: utf-8 -*-

import shelve
import flask
from flask.ext.restful import reqparse, Resource
from flask.ext.httpauth import HTTPBasicAuth
from passlib.apps import custom_app_context as pwd_context

from server import app, api

auth = HTTPBasicAuth()

# Repository

@auth.verify_password
def verify_password(username, password):
    user = get_user(username)
    
    if not user or not pwd_context.verify(password, user["password_hash"]):
        return False

    g.user = user
    return True


## Repository

def ucode(string):
    "Hack because shelve dosn't support unicode keys"
    return str(string).encode('utf-8')

def get_users():
    db = shelve.open('db/users.db')
    users = {user: db[user] for user in db}
    db.close()
    return users

def get_user(username):
    users = get_users()
    return users[username] if username in users else None

def add_user(username, password):
    if get_user(username):
        return False

    db = shelve.open('db/users.db')
    db[ucode(username)] = {
        "password_hash": pwd_context.encrypt(password),
    }


## Views

parser = reqparse.RequestParser()
parser.add_argument('username', 
    type=unicode, 
    location=["json", "values"], 
    required=True)

parser.add_argument('password', 
    type=unicode, 
    location=["json", "values"], 
    required=True)


class Login(Resource):

    def post(self):
        data = parser.parse_args()
        print data
        return {"username": "kjetil", "token": "31xb2gf1hf2"}, 200

class Users(Resource):

    def get(self):
        return get_users()

    def post(self):
        user = parser.parse_args()
        if get_user(user["username"]):
            return {"message": "username already taken"}, 403

        add_user(user.username, user.password)
        return {"username": user["username"]}, 201

api.add_resource(Login, '/api/login')
api.add_resource(Users, '/api/users')
