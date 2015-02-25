#!/usr/bin/env python

import sys
import os, os.path
from flask.ext.script import Manager, prompt, prompt_bool, prompt_pass

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

user_manager = Manager(usage = "Administrate users")
manager.add_command("users", user_manager)


@user_manager.option(dest='name')
@user_manager.option('-p', '--password', dest='password', required=False)
def add(name, password):
    "Adds a new user"
    
    if not password:
        password = prompt_pass("Password")

    success = authentication.add_user(name, password)
    if success:
        print "> Added user '{}'".format(name)
    else:
        print "> Seems user '{}' already exits...".format(name)


@user_manager.option(dest='name')
@user_manager.option('--keep-cellar', dest='keep_cellar', choices=['yes', 'no'], default='no')
def remove(name, keep_cellar):
    "Removes an existing user along with his/her cellar"
    
    user = authentication.get_user(name)
    if not user:
        print "> Found no user named '{}'".format(name)
        return

    prompt = "This will completely remove user '{}' {} \nProceed?".format(
        name, 
        "along with his/her cellar" if keep_cellar == 'no' else "")

    if not prompt_bool(prompt):
        print "> Aborted."
        return

    authentication.remove_user(name)
    if keep_cellar == 'no':
        repository.remove_all_beers(name)
    print "> Removed {}".format(name)
    

@user_manager.command
def list():
    "Lists all usernames"

    print "\n".join(sorted(authentication.get_users()))



if __name__ == "__main__":
    manager.run()

