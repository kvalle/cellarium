# -*- coding: utf-8 -*-

import shelve
import flask
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

def get_users():
    db = shelve.open('db/users.db')
    users = {user: db[user] for user in db}
    db.close()
    return users

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

    db = shelve.open('db/users.db')
    db[ucode(username)] = {
        "password_hash": pwd_context.encrypt(password)
    }

def verify_password(username, password):
    user = get_user(username)
    return user and pwd_context.verify(password, user["password_hash"])


## Tokens

def generate_auth_token(username):
    expiration = app.config['TOKEN_EXPIRATION_TIME']
    s = Serializer(app.config['SECRET_KEY'], expires_in = expiration)
    return s.dumps({ 'username': username })

def token_is_stored(token):
    db = shelve.open('db/tokens.db')
    stored = ucode(token) in db
    db.close()
    return stored

def store_token(token):
    db = shelve.open('db/tokens.db')
    db[ucode(token)] = True
    db.close()

def delete_token(token):
    db = shelve.open('db/tokens.db')
    if ucode(token) in db:
        del db[ucode(token)]
    db.close()    

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
        if get_user(user["username"]):
            return {"message": "username already taken"}, 403

        add_user(user.username, user.password)
        return {"username": user["username"]}, 201


api.add_resource(Token,       '/api/auth/token')
api.add_resource(Users,       '/api/auth/users')
