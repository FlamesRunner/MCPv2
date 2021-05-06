#!/usr/bin/env python3
import socket
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
HTTP_PREFIX = "http://"

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


@app.route('/api/start', methods=['POST'])
def start_server():
    # Check if server is owned by user
    server_id = request.form.get("server_id")
    if server_id is None:
        return jsonify({"status": "error", "msg": "No server ID specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})
    request_data = requests.post(HTTP_PREFIX + server_dict["host"] + "/start", data={"min_ram": str(
        server_dict["min_ram"]) + "M", "max_ram": str(server_dict["max_ram"]) + "M"}, headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "msg": "Successfully started server."})
    else:
        return jsonify({"status": "error", "msg": "Server is already online."})


@app.route('/api/kill', methods=['POST'])
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
        HTTP_PREFIX + server_dict["host"] + "/kill", headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "msg": "Successfully killed server."})
    else:
        return jsonify({"status": "error", "msg": "Server is already offline."})


@app.route('/api/stop', methods=['POST'])
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
        HTTP_PREFIX + server_dict["host"] + "/kill", headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "msg": "Successfully stopped server."})
    else:
        return jsonify({"status": "error", "msg": "Server is already offline."})


@app.route('/api/console/log', methods=['GET'])
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
        HTTP_PREFIX + server_dict["host"] + "/log", headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "log": request_dict["log"]})
    else:
        return jsonify({"status": "error", "msg": "Server is currently offline."})


@app.route('/api/console/send', methods=['POST'])
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
                                 "cmd": cmd}, headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    if request_dict["status"] == "success":
        return jsonify({"status": "success", "msg": "Successfully executed command."})
    else:
        return jsonify({"status": "error", "msg": "Server is currently offline."})

@app.route('/api/status', methods=['GET'])
def server_status():
    # Check if server is owned by user
    server_id = request.args.get("server_id")
    if server_id is None:
        return jsonify({"status": "error", "msg": "No server ID specified."})
    user_id = request.environ['user_var']['id']
    server_dict = get_server(user_id, server_id)
    if server_dict == None:
        return jsonify({"status": "error", "msg": "Server could not be found."})
    request_data = requests.get(HTTP_PREFIX + server_dict["host"] + "/status", headers={"TOKEN": server_dict["token"]})
    request_dict = json.loads(request_data.text)
    return jsonify({"status": "success", "power_level": request_dict["power_level"]})

if __name__ == "__main__":
    app.run()
