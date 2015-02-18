#!/usr/bin/env python

import sys
import os.path
import os


current_dir = os.path.dirname(os.path.realpath(__file__))
sys.path.append(current_dir + "/../server/")

from cellarium import app
from flask import send_from_directory

@app.route('/', defaults={'filename': 'index.html'})
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(os.path.join(current_dir, '../client/'), filename)


if __name__=='__main__':
    app.run(port=1337, host='0.0.0.0', debug=True)
