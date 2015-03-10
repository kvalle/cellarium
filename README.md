## Cellārium

Cellārium is a web application for storing information of which beers you are keeping down in your cellar.

### Technology

Cellārium is a SPA written in Angular, backed by a simple API implemented in Python.

### Developer setup

Setup:

- Make sure you have Vagrant installed
- `vagrant up`
- `vagrant ssh`
- `cd cellarium`
- `sudo pip install -r requirements.txt`

Run it:

- Run `./manage.py dev`
- Go to [localhost:1337/cellarium/](http://localhost:1337/cellarium/)

### Is it done yet?

No.

### Backlog:

Running, incomplete, and probaby not up to date list of stuff that needs doing:

- clear flash-messages on view change
- bug: flash messages don't work after one have been dismissed
- auto-suggest beers from untappd/ratebeer
- clean up dependencies on flash service
- contextual-classes for showing changes: http://getbootstrap.com/css/#tables-contextual-classes
- global error handling showing a generic message if anything goes wrong
- logging js-errors to server; http://engineering.talis.com/articles/client-side-error-logging/
- use cellery to clean stale tokens and such: http://flask.pocoo.org/docs/0.10/patterns/celery/
- improve testing and documentation: http://www.jeffknupp.com/blog/2014/01/29/productionizing-a-flask-application/
- serve as HTTPS 
