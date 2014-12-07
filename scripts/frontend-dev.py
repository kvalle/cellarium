#!/usr/bin/env python

import sys
import os.path
import SimpleHTTPServer
import SocketServer

PORT = 8000

current_dir = os.path.dirname(os.path.realpath(__file__))
os.chdir(current_dir + "/../frontend")

if __name__=='__main__':
    Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
    httpd = SocketServer.TCPServer(("", PORT), Handler)

    print "serving at port", PORT
    httpd.serve_forever()

