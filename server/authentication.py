# -*- coding: utf-8 -*-

import shelve
import flask
import re

from flask.ext.restful import reqparse, Resource
from passlib.apps import custom_app_context as pwd_context
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from itsdangerous import SignatureExpired, BadSignature

from functools import wraps
from flask import request, Response

from server import app, api


def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not 'X-Access-Token' in request.headers:
            return abort_401()

        token = request.headers['X-Access-Token'] 
        user = authenticate_token(token)
        if not user:
            return abort_401()
            
        flask.g.user = user
        flask.g.token = token

        return f(*args, **kwargs)
    return decorated

def authenticate_token(token):
    if not token_is_stored(token):
        return None

    data = verify_auth_token(token)
    if not data:
        return None

    return get_user(data["username"])

def abort_401():
    return Response('Authentication required', 401, {'WWW-Authenticate': 'Token'})

def ucode(string):
    "Hack because shelve dosn't support unicode keys"
    return str(string).encode('utf-8')


## Users

class UserDB:
    def __enter__(self):
        self.db = shelve.open('db/users.db')
        return self.db

    def __exit__(self, type, value, tb):
        self.db.close()


def get_users():
    with UserDB() as db:
        return {user: db[user] for user in db}

def get_user(username):
    users = get_users()
    if not username in users:
        return None
    user = users[username] 
    user["username"] = username
    return user

def add_user(username, password):
    if get_user(username):
        return False

    data = {
        "password_hash": pwd_context.encrypt(password)
    }

    with UserDB() as db:
        db[ucode(username)] = data

def correct_password(user, password):
    return pwd_context.verify(password, user["password_hash"])

def verify_password(username, password):
    user = get_user(username)
    return user and correct_password(user, password)

def is_legal_username(username):
    return re.match('^[\w_]+$', username)


## Tokens

class TokenDB:
    def __enter__(self):
        self.db = shelve.open('db/token.db')
        return self.db

    def __exit__(self, type, value, tb):
        self.db.close()


def generate_auth_token(username):
    expiration = app.config['TOKEN_EXPIRATION_TIME']
    s = Serializer(app.config['SECRET_KEY'], expires_in = expiration)
    return s.dumps({ 'username': username })

def token_is_stored(token):
    with TokenDB() as db:
        return ucode(token) in db

def store_token(token):
    with TokenDB() as db:
        db[ucode(token)] = True

def delete_token(token):
    with TokenDB() as db:
        if ucode(token) in db:
            del db[ucode(token)]

def verify_auth_token(token):
    s = Serializer(app.config['SECRET_KEY'])
    
    try:
        return s.loads(token)
    except SignatureExpired:
        return None # valid token, but expired
    except BadSignature:
        return None # invalid token


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


class Token(Resource):

    def post(self):
        user = parser.parse_args()
        username = user['username']
        password = user['password']

        if not verify_password(username, password):
            return "Unauthorized Access", 401
        
        token = generate_auth_token(username)
        store_token(token)
        return {
            "token": token.decode('ascii'),
            "username": username
        }, 200

    @requires_auth
    def delete(self):
        token = None
        delete_token(flask.g.token)
        return '', 204

class Users(Resource):

    def get(self):
        return get_users()

    def post(self):
        user = parser.parse_args()

        if not is_legal_username(user["username"]):
            return {"message": "Bad username: only letters and numbers allowed."}, 403

        if get_user(user["username"]):
            return {"message": "Username already taken."}, 403

        add_user(user.username, user.password)
        return {"username": user["username"]}, 201


api.add_resource(Token,       '/api/auth/token')
api.add_resource(Users,       '/api/auth/users')
