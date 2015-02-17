## Cellārium

Cellārium is a web application for storing information of which beers you are keeping down in your cellar.

### Technology

Cellārium is a SPA written in Angular, backed by a simple API implemented in Python.

### Developer setup

- Make sure you have Vagrant installed
- `vagrant up`
- `vagrant ssh`
- `cd cellarium`
- `sudo pip install -r requirements.txt`

### Is it done yet?

No.

### Backlog:

Running, incomplete, and probaby not up to date list of stuff that needs doing:

- keep login session alive when using the app
- change password on settings page
- list ordering: https://docs.angularjs.org/api/ng/filter/orderBy
- serve as HTTPS 
- auto-suggest beers from untappd/ratebeer
- bug: flash messages don't work after one have been dismissed
- clean up naming within modules
- clean up dependencies on flash service
- contextual-classes for showing changes: http://getbootstrap.com/css/#tables-contextual-classes
