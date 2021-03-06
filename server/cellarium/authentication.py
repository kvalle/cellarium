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

from cellarium import app, api

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
        db_path = '{}/users.db'.format(app.config['DB_PATH'])
        self.db = shelve.open(db_path)
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

def update_user_password(username, new_password):
    with UserDB() as db:
        user = db[ucode(username)]
        user['password_hash'] = pwd_context.encrypt(new_password)
        db[ucode(username)] = user

def add_user(username, password):
    if get_user(username):
        return False

    data = {
        "password_hash": pwd_context.encrypt(password),
        "created": time.time(),
        "username": username
    }

    with UserDB() as db:
        db[ucode(username)] = data

    return data

def remove_user(username):
    with UserDB() as db:
        del db[ucode(username)]

def verify_password(username, password):
    user = get_user(username)
    return user and pwd_context.verify(password, user["password_hash"])

def is_legal_username(username):
    return re.match('^[\w_]+$', username)

def is_acceptable_password(password):
    return password and len(password) >= 8

## Tokens

class TokenDB:
    def __enter__(self):
        db_path = '{}/tokens.db'.format(app.config['DB_PATH'])
        self.db = shelve.open(db_path)
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

def get_tokens():
    with TokenDB() as db:
        return {token: db[token] for token in db}

def get_users():
    with UserDB() as db:
        return {user: db[user] for user in db}

def store_token(token, username, timestamp):
    with TokenDB() as db:
        db[ucode(token)] = {
            'timestamp': timestamp,
            'username': username
        }

def revoke_token(token):
    with TokenDB() as db:
        if ucode(token) in db:
            del db[ucode(token)]

def revoke_tokens_for_user(username):
    with TokenDB() as db:
        for token in db:
            if db[token]["username"] == username:
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

## Request parser

parser = reqparse.RequestParser()
parser.add_argument('username', 
    type=unicode, 
    location=["json", "values"], 
    required=False)

parser.add_argument('password', 
    type=unicode, 
    location=["json", "values"], 
    required=False)

parser.add_argument('new_password', 
    type=unicode, 
    location=["json", "values"], 
    required=False)


## Token views

class Tokens(Resource):

    def get(self):
        "List all tokens"

        if not app.debug:
            return "Sorry, Dave.", 418

        return get_tokens(), 200

    def post(self):
        "Obtain acces token by providing username/password"

        user = parser.parse_args()
        username = user['username']
        password = user['password']

        if not verify_password(username, password):
            return {"userMessage": "Wrong password"}, 400
        
        timestamp = time.time()
        token = generate_auth_token(username, timestamp)
        store_token(token, username, timestamp)
        return {
            "token": token.decode('ascii'),
            "username": username
        }, 200

    @requires_auth
    def delete(self):
        "Revoke all access tokens created by user"

        user = flask.g.user
        print user
        revoke_tokens_for_user(user['username'])
        
        return '', 204

class Token(Resource):

    def delete(self, token):
        "Revoke access token"

        revoke_token(token)
        return '', 204


## User views

class Users(Resource):

    def get(self):
        "List all users"

        if not app.debug:
            return "Sorry, Dave.", 418

        return get_users(), 200

    def post(self):
        "Create new user"

        if not app.debug:
            return "Sorry, Dave.", 418

        user = parser.parse_args()

        if not is_legal_username(user.username):
            return {"userMessage": "Bad username: only letters and numbers allowed."}, 400

        if get_user(user["username"]):
            return {"userMessage": "Username already taken."}, 400

        add_user(user.username, user.password)
        return {"username": user["username"]}, 201

    def put(self):
        data = parser.parse_args()

        if not verify_password(data.username, data.password):
            return {"userMessage": "Wrong password"}, 400

        if not is_acceptable_password(data.new_password):
            return {"userMessage": "New password not strong enough."}, 400

        update_user_password(data.username, data.new_password)

        return "", 200


api.add_resource(Users,  '/api/auth/users')
api.add_resource(Token,  '/api/auth/tokens/<string:token>')
api.add_resource(Tokens, '/api/auth/tokens')
