import logging
import logging.handlers
import flask
import traceback
from cellarium import app

# Setting up loggers

formatter = logging.Formatter("[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
handler = logging.handlers.RotatingFileHandler(app.config['LOG_FILENAME'], maxBytes=10000000, backupCount=5)
handler.setLevel(app.config['LOG_LEVEL'])
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(app.config['LOG_LEVEL'])

werkzeug_log = logging.getLogger('werkzeug')
werkzeug_log.setLevel(logging.DEBUG)
werkzeug_log.addHandler(handler)

# Configure flask exception logging

def log_exception(sender, exception, **extra):
    """ Log an exception to our logging framework """
    sender.logger.exception('Got exception during processing: %s', exception)

flask.got_request_exception.connect(log_exception, app)
