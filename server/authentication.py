# -*- coding: utf-8 -*-

import shelve
import flask
import re
import time
from functools import wraps

from flask import request, Response
from flask.ext.restful import reqparse, Resource
from passlib.apps import custom_app_context as pwd_context
from itsdangerous import JSONWebSignatureSerializer as Serializer
from itsdangerous import SignatureExpired, BadSignature

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

        extend_token_lifespan(token)

        return f(*args, **kwargs)
    return decorated

@app.after_request
def after_request(response):
    if hasattr(flask.g, 'token'):
        response.headers.add('X-Access-Token-Renewed', 'True')
    return response

def authenticate_token(token):
    data = get_token(token)
    if not data:
        return None

    ttl = app.config['ACCESS_TOKEN_TTL']
    token_age = time.time() - data['timestamp']
    if token_age > ttl:
        return None

    token_data = verify_auth_token(token)
    if not token_data:
        return None

    return get_user(token_data["username"])

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
        self.db = shelve.open('db/tokens.db')
        return self.db

    def __exit__(self, type, value, tb):
        self.db.close()


def generate_auth_token(username, timestamp):
    s = Serializer(app.config['SECRET_KEY'])
    return s.dumps({ 
        'username': username, 
        'generated': timestamp 
    })

def get_token(token):
    key = ucode(token)
    with TokenDB() as db:
        return db[key] if key in db else None

def store_token(token, username, timestamp):
    with TokenDB() as db:
        db[ucode(token)] = {
            'timestamp': timestamp,
            'username': username
        }

def delete_token(token):
    with TokenDB() as db:
        if ucode(token) in db:
            del db[ucode(token)]

def verify_auth_token(token):
    s = Serializer(app.config['SECRET_KEY'])
    
    try:
        return s.loads(token)
    except BadSignature:
        return None

def extend_token_lifespan(token):
    key = ucode(token)
    with TokenDB() as db:
        if key in db:
            data = db[key]
            data['timestamp'] = time.time()
            db[key] = data

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


class CreateToken(Resource):

    def post(self):
        "Obtain acces token by providing username/password"

        user = parser.parse_args()
        username = user['username']
        password = user['password']

        if not verify_password(username, password):
            return "Unauthorized Access", 401
        
        timestamp = time.time()
        token = generate_auth_token(username, timestamp)
        store_token(token, username, timestamp)
        return {
            "token": token.decode('ascii'),
            "username": username
        }, 200

class RevokeToken(Resource):

    def delete(self, token):
        "Revoke access token"

        delete_token(token)
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


api.add_resource(Users,       '/api/auth/users')
api.add_resource(CreateToken, '/api/auth/token')
api.add_resource(RevokeToken, '/api/auth/token/<string:token>')
