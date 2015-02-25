#!/usr/bin/env python

import sys
import os, os.path
from flask.ext.script import Manager, prompt_bool

## Initial setup to be able to import Cellarium app properly

current_dir = os.path.dirname(os.path.realpath(__file__))
cellarium_home = os.path.join(current_dir, "server")

sys.path.append(cellarium_home)
os.environ["CELLARIUM_HOME"] = "{}".format(cellarium_home)


## Importing app and initializing manager

from flask import send_from_directory
from cellarium import app, authentication, repository

manager = Manager(app)


## TASK: Dev server

@app.route('/cellarium/', defaults={'filename': 'index.html'})
@app.route('/cellarium/<path:filename>')
def static_files(filename):
    return send_from_directory(os.path.join(current_dir, 'client'), filename)

@manager.option('-h', '--host', dest='host', type=str, default="0.0.0.0")
@manager.option('-p', '--port', dest='port', type=int, default=1337)
@manager.option('-d', '--debug', dest='debug', choices=['on', 'off'], default='on')
def dev(host, port, debug):
    "Runs Cellarium dev server with client + API"

    with_debug = debug == 'on'
    app.run(port=port, host=host, debug=with_debug)


## TASK: Manage users

@manager.option('-p', '--password', dest='password', required=True)
@manager.option('-n', '--name', dest='name', required=True)
def adduser(name, password):
    "Adds new user"

    success = authentication.add_user(name, password)
    if success:
        print "> added user '{}'".format(name)
    else:
        print "> seems user '{}' already exits...".format(name)

@manager.option('-n', '--name', dest='name', required=True)
def killuser(name):
    "Removes user and associated beers"

    user = authentication.get_user(name)
    if not user:
        print "> found no user named '{}'".format(name)
        return

    if prompt_bool("Are you sure you want completely remove user '{}'".format(name)):
        authentication.remove_user(name)
        repository.remove_all_beers(name)
        print "> Removed {} and all his/her beers!".format(name)
    else:
        print "> Aborted."


if __name__ == "__main__":
    manager.run()

