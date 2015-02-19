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

- Start `./scripts/dev-server.py`
- Go to http://localhost:1337/cellarium/

### Is it done yet?

No.

### Backlog:

Running, incomplete, and probaby not up to date list of stuff that needs doing:

- better logging from flask
- add 'change password' form on settings page
- list ordering: https://docs.angularjs.org/api/ng/filter/orderBy
- auto-suggest beers from untappd/ratebeer
- bug: flash messages don't work after one have been dismissed
- clean up naming within modules
- clean up dependencies on flash service
- contextual-classes for showing changes: http://getbootstrap.com/css/#tables-contextual-classes
- global error handling showing a generic message if anything goes wrong
- logging js-errors to server; http://engineering.talis.com/articles/client-side-error-logging/
- use cellery to clean stale tokens and such: http://flask.pocoo.org/docs/0.10/patterns/celery/
- improve testing and documentation: http://www.jeffknupp.com/blog/2014/01/29/productionizing-a-flask-application/
- logging of frontend errors
- serve as HTTPS 
