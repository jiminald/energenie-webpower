#!/usr/bin/env python3

import os
import json
import atexit
import bottle
from time import sleep
from bottle import route, request, response, template, static_file
from gpiozero import Energenie

# Set Document Root by using the current file directory
DOCUMENT_ROOT = os.path.dirname(os.path.abspath(__file__))

# Load JSON config
with open(DOCUMENT_ROOT+'/config.json', 'r') as f:
    CONFIG = json.load(f)

# print(json.dumps(CONFIG, indent=4, sort_keys=True))

# Dynamically load the sockets we're controlling
sockets = [0]
for key, val in CONFIG['sockets'].items():
    # Convert the key from a string to an integer
    key = int(key)
    # Create our connection to the socket and set the default state of the socket
    sockets.insert(key, Energenie(key, bool(val['default_state'])))

# Function to control the socket
def energenie_socket_power(id, action):
    # Open a connection to the socket
    socket = sockets[id]

    # Do action
    if action == 'off':
        socket.off()
    elif action == 'on':
        socket.on()

    # Sleep, to ensure the command is sent
    sleep(0.05)

# Function to control the socket
def energenie_socket_state(id):
    # Open a connection to the socket
    socket = sockets[id]

    # Find out what state the socket is in (On or Off)
    val = socket.value

    # Give this back to whomever asked for it
    return val

# Close everything when we quit the script
def on_exit():
    for key, val in CONFIG['sockets'].items():
        key = int(key)
        sockets[key].close()

# Register the shutdown function
atexit.register(on_exit)

# Create the bottle web server
app = bottle.Bottle()

# Public assets and resources
@app.route('/public/<filename:re:.+>')
def server_public(filename):
    return static_file(filename, root=DOCUMENT_ROOT+"/public")

# Serve up config.json
@app.route('/config.json')
def server_config():
    return static_file('config.json', root=DOCUMENT_ROOT)

# Serve up the state of the socket
@app.route('/state/<socket_id:int>')
def socket_state(socket_id):
    return '{"state":"%s"}' % str(energenie_socket_state(socket_id)).lower()

# Change the Socket State
@app.route('/state/<socket_id:int>/<action>')
def socket_state_trigger(socket_id, action):
    energenie_socket_power(socket_id, action)
    return socket_state(socket_id)

# Serve up the default index.html page
@app.route('/')
def server_home():
    return static_file('index.html', root=DOCUMENT_ROOT+"/public")

# Start web server
app.run(host=CONFIG['http_host'], port=CONFIG['http_port'])
