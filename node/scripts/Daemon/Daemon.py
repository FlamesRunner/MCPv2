#!/usr/bin/env python3
from Authentication import AuthenticationMiddleware
import socket
import subprocess
import sqlite3
import json
import hashlib
import secrets
import time
import os
from datetime import datetime
from flask import Flask, render_template, g, request, redirect, url_for, make_response
app = Flask(__name__)

app.wsgi_app = AuthenticationMiddleware(app.wsgi_app)

# Get database object


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect("./node.db")
    return db

# Database fetch


def query_db(query, args=(), single=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if single else rv

# Database query


def action_query(query, params):
    c = get_db().cursor()
    c.execute(query, params)
    get_db().commit()

# Return JSON output
def jsonify(input: dict):
    return json.dumps(input)


"""
    Runs a command on a Minecraft server.
    
    Args: 
        - Takes in two parameters, cmd: str and username: str,
    which are the command and username for the Minecraft user respectively.

    Returns:
        - Nothing
"""
def run_cmd_helper(cmd: str, username: str):
    path = '/home/' + username
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
        client.connect(path + "/mcp_in.sock")
        client.sendall((cmd + "\r\n").encode())
        client.close()

"""
    Returns the server status.
    
    Args: 
        - Takes in MC server username

    Returns:
        - Boolean value, True if on, False if off
"""
def server_status(username: str):
    res = subprocess.run(['ps', '-U', username], stdout=subprocess.PIPE)
    if res.returncode > 0:
        return False
    if "server_start" in res.stdout.decode("utf-8"):
        return True
    return False

"""
    Returns console output.
    
    Args: 
        - None

    Returns:
        - Returns JSON string containing log
"""
@app.route('/log', methods=['GET'])
def get_log():
    user = request.environ['user_var']['username']
    path = '/home/' + user + '/console.txt'
    f = open(path, "r")
    output = f.read()
    if server_status(user) == False:
        output = output + "\n[Server is offline]"
    return jsonify({"status": "success", "log": output})


"""
    Starts MC server.
    
    Args: 
        - None

    Returns:
        - Returns JSON string as result.
"""
@app.route('/start', methods=['POST'])
def start_server():
    max_ram = request.form.get("max_ram")
    min_ram = request.form.get("min_ram")
    if max_ram == None or min_ram == None:
        return jsonify({"status": "error", "msg": "max_ram/min_ram not specified"})
    user = request.environ['user_var']['username']
    if server_status(user) == True:
        return jsonify({"status": "error", "msg": "Server is already running."})
    path = '/home/' + user
    cmd_str = 'cd ' + path + ' && su - ' + user + ' -c \'nohup ./server_start ' + \
        max_ram + ' ' + min_ram + ' &> /dev/null\''
    os.system(cmd_str)
    return jsonify({"status": "success"})

"""
    Kills a Minecraft server.
    
    Args: 
        - None
    Returns:
        - Returns JSON string indicating whether or not the server was successfully killed.
"""
@app.route('/kill', methods=['POST'])
def kill_server():
    user = request.environ['user_var']['username']
    if server_status(user) == False:
        return jsonify({"status": "error", "msg": "Server is not running."})
    os.system("pkill -U " + user + " -9 java")
    os.system("pkill -U " + user + " -9 server_start")
    return jsonify({"status": "success"})

"""
    Runs a command on a Minecraft server.
    
    Args: 
        - Takes in two parameters, cmd: str and username: str,
    which are the command and username for the Minecraft user respectively.

    Returns:
        - Nothing
"""
@app.route('/cmd', methods=['POST'])
def run_cmd():
    cmd = request.form.get("cmd")
    if server_status(request.environ['user_var']['username']) == False:
        return jsonify({"status": "error", "msg": "Server is not running."})
    run_cmd_helper(cmd, request.environ['user_var']['username'])
    return jsonify({"status": "success"})

"""
    Gracefully stops a Minecraft server.
    
    Args: 
        - None

    Returns:
        - Returns JSON string indicating whether or not the server was successfully stopped.
"""
@app.route('/stop', methods=['POST'])
def stop_server():
    user = request.environ['user_var']['username']
    if server_status(user) == False:
        return jsonify({"status": "error", "msg": "Server is not running."})
    run_cmd_helper("stop", user)
    os.system("pkill -U " + user + " -9 server_start")
    return jsonify({"status": "success"})

"""
    Returns power level of MC server.
    
    Args: 
        - None

    Returns:
        - Returns JSON string indicating whether or not the server is on.
"""
@app.route('/status', methods=['GET'])
def status():
    user = request.environ['user_var']['username']
    status = server_status(user)
    result = subprocess.run(['./memory_usage.bash', user], stdout=subprocess.PIPE)
    memory_usage = result.stdout.decode('utf-8').rstrip('\n')
    return jsonify({"status": "success", "power_level": "on" if status else "off", "memory_usage": memory_usage })

if __name__ == "__main__":
    app.run(port=5001)
