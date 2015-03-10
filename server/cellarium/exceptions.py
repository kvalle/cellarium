# -*- coding: utf-8 -*-

from werkzeug.exceptions import HTTPException
import abc


class CellariumException(HTTPException):
	"Base class for Exceptions"

	code = 500
	_metaclass__  = abc.ABCMeta


class BeerNotFoundException(CellariumException):
    code = 404
    
    def __init__(self, beer_id):
        self.description = "No beer found for ID '%s'." % str(beer_id)
