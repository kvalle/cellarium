#!/usr/bin/env python

import sys
import os, os.path
from flask.ext.script import Manager

## Initial setup to be able to import Cellarium app properly

current_dir = os.path.dirname(os.path.realpath(__file__))
cellarium_home = os.path.join(current_dir, "server")

sys.path.append(cellarium_home)
os.environ["CELLARIUM_HOME"] = "{}".format(cellarium_home)


## Importing app and initializing manager

from flask import send_from_directory
from cellarium import app

manager = Manager(app)


## TASK: Dev server

@app.route('/cellarium/', defaults={'filename': 'index.html'})
@app.route('/cellarium/<path:filename>')
def static_files(filename):
    return send_from_directory(os.path.join(current_dir, 'client'), filename)

@manager.command
def dev():
    "Run Cellarium dev server with client + API"
    app.run(port=1337, host='0.0.0.0', debug=True)


if __name__ == "__main__":
    manager.run()

