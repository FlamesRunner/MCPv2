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
from dotenv import load_dotenv
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
        client.connect(path + "/server/mcp_in.sock")
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
    if "mcp_wrapper" in res.stdout.decode("utf-8"):
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
    path = '/home/' + user + '/server/server_console.log'
    # Check if file exists
    if not os.path.isfile(path):
        return jsonify({'status': 'success', 'log': ''})

    f = open(path, "r")
    output = f.read()
    if server_status(user) == False:
        output = output + "\n[Server is offline]"
    return jsonify({"status": "success", "log": output})


"""
    Get the current user's username.

    Args:
        None
    
    Returns:
        - username: The current user's username.
"""


@app.route('/user', methods=['GET'])
def get_user():
    user = request.environ['user_var']['username']
    return jsonify({"status": "success", "username": user})


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

    # Create server config file and save to /home/$user/server_config.txt
    # Write to file
    f = open("/home/" + user + "/server_config.txt", "w")
    f.write("EXECUTABLE=/usr/bin/java\n")
    f.write("WORKING_DIR=/home/" + user + "/server\n")
    f.write("ARGS=java -Xmx" + max_ram + " -Xms" + min_ram + " -jar server.jar\n")
    f.write("OUTPUT=/home/" + user + "/server/server_console.log\n")
    f.write("SOCKET=/home/" + user + "/server/mcp_in.sock\n")
    f.write("UID=" + user + "\n")
    f.write("GID=" + user + "\n")
    f.close()

    path_to_config = "/home/" + user + "/server_config.txt"
    cmd_str = "nohup /usr/sbin/mcp_wrapper " + path_to_config + " &> /dev/null"
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
    os.system("pkill -U " + user + " -9 mcp_wrapper")
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
    # Wait for server to stop for 15 seconds
    for i in range(15):
        if server_status(user) == False:
            return jsonify({"status": "success"})
        time.sleep(1)
    # If server is still running, return error
    return jsonify({"status": "error", "msg": "Server is still running -- has it stopped responding? If the problem persists, please save your world and kill the server."})

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
    result = subprocess.run(
        ['./memory_usage.bash', user], stdout=subprocess.PIPE)
    memory_usage = result.stdout.decode('utf-8').rstrip('\n')
    return jsonify({"status": "success", "power_level": "on" if status else "off", "memory_usage": memory_usage})


if __name__ == "__main__":
    app.run(port=5001)

"""
    List every server in the database.

    Args:
        - None

    Returns:
        - JSON string containing all servers    
"""


@app.route('/list_all', methods=['GET'])
def list_all():
    user = request.environ['user_var']['username']
    if user != "root":
        return jsonify({"status": "error", "msg": "You must be root."})
    c = get_db().cursor()
    c.execute("SELECT * FROM servers")
    result = c.fetchall()
    return jsonify({"status": "success", "servers": result})


"""
    Create a new server.

    Args:
        - Takes in username: str, max_ram: str, min_ram: str, and name: str
    Returns:
        - JSON string indicating whether or not the server was successfully created.
"""


@app.route('/create', methods=['POST'])
def create_server():
    user = request.environ['user_var']['username']
    if user != "root":
        return jsonify({"status": "error", "msg": "You must be root."})
    username = request.form.get("username")
    if username == None:
        return jsonify({"status": "error", "msg": "Username not specified"})
    if username.isalnum() == False:
        return jsonify({"status": "error", "msg": "Username must be alphanumeric"})
    if len(username) <= 8 or len(username) >= 16:
        return jsonify({"status": "error", "msg": "Username must be between 8 and 16 characters"})

    # Check if user exists
    c = get_db().cursor()
    c.execute("SELECT * FROM servers WHERE user = ?", (username,))
    result = c.fetchall()
    if len(result) != 0:
        return jsonify({"status": "error", "msg": "User already exists"})

    # Generate cryptographically secure 32-character alphanumeric token
    random = secrets.SystemRandom()
    token = ''.join(random.choice(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for _ in range(32))

    # Execute add-server.bash $username
    result = subprocess.run(
        ['./add-server.bash', username, token], stdout=subprocess.PIPE)

    if result.returncode == 0:
        return jsonify({"status": "success", "msg": "Server successfully created.", "token": token})
    else:
        return jsonify({"status": "error", "msg": "Error: " + result.stdout.decode('utf-8').rstrip('\n')})


"""
    Delete a server.

    Args:
        - Takes in username: str
    Returns:
        - JSON string indicating whether or not the server was successfully deleted.
"""


@app.route('/delete', methods=['POST'])
def delete_server():
    user = request.environ['user_var']['username']
    if user != "root":
        return jsonify({"status": "error", "msg": "You must be root."})
    username = request.form.get("username")
    if username == None:
        return jsonify({"status": "error", "msg": "Username not specified"})
    if username.isalnum() == False:
        return jsonify({"status": "error", "msg": "Username must be alphanumeric"})
    if len(username) <= 8 or len(username) >= 16:
        return jsonify({"status": "error", "msg": "Username must be between 8 and 16 characters"})

    # Check if server exists in database
    c = get_db().cursor()
    c.execute("SELECT * FROM servers WHERE user=?", (username,))
    result = c.fetchall()
    if len(result) == 0:
        return jsonify({"status": "error", "msg": "Server does not exist."})

    # Execute remove-server.bash $username
    result = subprocess.run(
        ['./delete-server.bash', username], stdout=subprocess.PIPE)

    # Delete server from database with user: $username
    if result.returncode == 0:
        c.execute("DELETE FROM servers WHERE user=?", (username,))
        get_db().commit()
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "error", "msg": "Error: Your server could not be deleted."})


""" 
    Generates SFTP password for a server.

    Args:
        - None
    Returns:
        - JSON string containing SFTP password if successful, otherwise error message.
"""


@app.route('/sftp', methods=['GET'])
def sftp():
    user = request.environ['user_var']['username']
    random = secrets.SystemRandom()
    token = ''.join(random.choice(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for _ in range(10))

    # Change system password for user
    result = subprocess.run(
        ['./change-password.bash', user, token], stdout=subprocess.PIPE)

    if result.returncode == 0:
        return jsonify({"status": "success", "msg": "SFTP password successfully generated.", "password": token})
    return jsonify({"status": "error", "msg": "SFTP password could not be generated."})
