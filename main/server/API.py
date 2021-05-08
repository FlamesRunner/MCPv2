#!/usr/bin/env python3
import socket
import ipaddress
import subprocess
import sqlite3
import json
import hashlib
import secrets
import time
import requests
import os
from datetime import datetime
from flask import Flask, render_template, g, request, redirect, url_for, make_response, Blueprint
from Authentication import AuthenticationMiddleware
app = Flask(__name__)
app.wsgi_app = AuthenticationMiddleware(app.wsgi_app)
HTTP_PREFIX = "https://"

# Get database object


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect("./mcp_data.db")
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


def get_server(owned_by: int, server_id: int):
    server_data = query_db(
        "SELECT * FROM servers WHERE server_id = ? AND owned_by = ?", (server_id, owned_by), True)
    if server_data is None:
        return None
    server_dict = {
        "server_id": server_data[0],
        "server_name": server_data[1],
        "owned_by": server_data[2],
        "host": server_data[3],
        "token": server_data[4],
        "max_ram": server_data[5],
        "min_ram": server_data[6]
    }
    return server_dict


@app.route('/')
def api_home():
    return jsonify({"status": "success", "msg": "Authenticated"})


@app.route('/api/server/start', methods=['POST'])
def start_server():
    # Check if server is owned by user
    server_id = request.form.get("server_id")
    if server_id is None:
        return jsonify({"status": "error", "msg": "No server ID specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})
    request_data = requests.post(HTTP_PREFIX + server_dict["host"] + "/start", verify=False, data={"min_ram": str(
        server_dict["min_ram"]) + "M", "max_ram": str(server_dict["max_ram"]) + "M"}, headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "msg": "Successfully started server."})
    else:
        return jsonify({"status": "error", "msg": "Server is already online."})


@app.route('/api/server/kill', methods=['POST'])
def kill_server():
    # Check if server is owned by user
    server_id = request.form.get("server_id")
    if server_id is None:
        return jsonify({"status": "error", "msg": "No server ID specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})
    request_data = requests.post(
        HTTP_PREFIX + server_dict["host"] + "/kill", verify=False, headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "msg": "Successfully killed server."})
    else:
        return jsonify({"status": "error", "msg": "Server is already offline."})


@app.route('/api/server/stop', methods=['POST'])
def stop_server():
    # Check if server is owned by user
    server_id = request.form.get("server_id")
    if server_id is None:
        return jsonify({"status": "error", "msg": "No server ID specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})
    request_data = requests.post(
        HTTP_PREFIX + server_dict["host"] + "/kill", verify=False, headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "msg": "Successfully stopped server."})
    else:
        return jsonify({"status": "error", "msg": "Server is already offline."})


@app.route('/api/server/console/log', methods=['GET'])
def console_output():
    # Check if server is owned by user
    server_id = request.args.get("server_id")
    if server_id is None:
        return jsonify({"status": "error", "msg": "No server ID specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})
    request_data = requests.get(
        HTTP_PREFIX + server_dict["host"] + "/log", verify=False, headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "log": request_dict["log"]})
    else:
        return jsonify({"status": "error", "msg": "Server is currently offline."})


@app.route('/api/server/console/send', methods=['POST'])
def send_cmd():
    # Check if server is owned by user
    server_id = request.form.get("server_id")
    cmd = request.form.get("cmd")
    if server_id is None or cmd is None:
        return jsonify({"status": "error", "msg": "No server ID and/or command specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})
    request_data = requests.post(HTTP_PREFIX + server_dict["host"] + "/cmd", data={
                                 "cmd": cmd}, verify=False, headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "msg": "Successfully executed command."})
    else:
        return jsonify({"status": "error", "msg": "Server is currently offline."})


@app.route('/api/server/status', methods=['GET'])
def server_status():
    # Check if server is owned by user
    server_id = request.args.get("server_id")
    if server_id is None:
        return jsonify({"status": "error", "msg": "No server ID specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})
    request_data = requests.get(
        HTTP_PREFIX + server_dict["host"] + "/status", verify=False, headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    return jsonify({"status": "success", "power_level": request_dict["power_level"], "memory_usage": request_dict["memory_usage"] })


@app.route('/api/server/list', methods=['GET'])
def list_servers():
    user_id = request.environ['user_var']['id']
    server_data = query_db(
        "SELECT * FROM servers WHERE owned_by = ?", (user_id,), False)
    server_lst = []
    for server_tuple in server_data:
        server_lst.append({
            "server_id": server_tuple[0],
            "server_name": server_tuple[1],
            "host": server_tuple[3],
            "max_ram": server_tuple[5],
            "min_ram": server_tuple[6]
        })
    return jsonify({"status": "success", "servers": server_lst})


@app.route('/api/server/new', methods=['POST'])
def create_server():
    user_id = request.environ['user_var']['id']
    server_host = request.form.get("server_host")
    server_token = request.form.get("server_token")
    server_name = request.form.get("server_name")
    max_ram = request.form.get("server_ram_max")
    min_ram = request.form.get("server_ram_min")

    # Validation galore
    if server_host is None or server_token is None or server_name is None or max_ram is None or min_ram is None:
        return jsonify({"status": "error", "msg": "One or more fields are empty."})

    if not server_name.isalnum():
        return jsonify({"status": "error", "msg": "The server name must be alphanumeric."})

    filtered_ip = ""
    try:
        filtered_ip = ipaddress.ip_address(server_host)
    except ValueError:
        return jsonify({"status": "error", "msg": "The server host must be a valid IP address."})

    if not max_ram.isnumeric() or not min_ram.isnumeric():
        return jsonify({"status": "error", "msg": "The RAM values must be be numeric (in megabytes)."})

    # Attempt to connect to the target server.
    try:
        if requests.get(HTTP_PREFIX + filtered_ip.__str__() + ":5000/status", verify=False, headers={"TOKEN": server_token}).status_code == 401:
            return jsonify({"status": "error", "msg": "The server token specified is invalid."})
    except:
        return jsonify({"status": "error", "msg": "Could not connect to host."})

    if int(max_ram) < int(min_ram):
        return jsonify({"status": "error", "msg": "The maximum amount of memory must be larger or equal to the minimum amount of memory allocated."})

    # Finally done validation
    action_query("INSERT INTO servers (server_name, owned_by, host, token, max_ram, min_ram) VALUES (?, ?, ?, ?, ?, ?)",
                 (server_name, user_id, filtered_ip.__str__() + ":5000", server_token, max_ram, min_ram))
    return jsonify({"status": "success", "msg": "The server was successfully added."})

@app.route('/api/server/delete', methods=['POST'])
def delete_server():
    # Check if server is owned by user
    server_id = request.form.get("server_id")
    if server_id is None:
        return jsonify({"status": "error", "msg": "No server ID specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})

    action_query("DELETE FROM servers WHERE server_id=?", (server_id,))
    return jsonify({"status": "success", "msg": "The server was removed successfully."})

if __name__ == "__main__":
    app.run()
