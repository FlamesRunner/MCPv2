#!/usr/bin/env python3
import sqlite3
from flask import g
import secrets
from hashlib import sha256
import time
import json
from werkzeug.wrappers import Request, Response, ResponseStream


class AuthenticationMiddleware():
    '''
    Authentication middleware
    '''

    def __init__(self, app):
        self.app = app

    def authenticate(self, token: str):
        data = self.query_db(
            "SELECT * FROM sessions WHERE token=?", (token,), True)
        if data == None:
            return False
        # Return username
        return {"id": data[1], "username": data[2], "expires": data[3]}

    # Database query
    def action_query(self, query, params):
        conn = sqlite3.connect("./mcp_data.db")
        c = conn.cursor()
        c.execute(query, params)
        conn.commit()
        conn.close()

    # Database fetch
    def query_db(self, query, args=(), single=False):
        cur = sqlite3.connect("./mcp_data.db").execute(query, args)
        rv = cur.fetchall()
        cur.close()
        return (rv[0] if rv else None) if single else rv

    def generate_token(self, environ, start_response):
        request = Request(environ)
        form_user = request.form.get('username')
        form_pass = request.form.get('password')
        salt_data_raw = self.query_db(
            "SELECT salt FROM users WHERE username=?", (form_user,), True)
        if salt_data_raw == None or form_pass == None:
            return Response(u'Authorization failed', mimetype='text/plain', status=401)(environ, start_response)
        salt = salt_data_raw[0]  # Salt found. Now, we hash the password:
        hashed_password = sha256(
            (form_pass + salt).encode('utf-8')).hexdigest()
        user_data = self.query_db(
            "SELECT * FROM users WHERE username = ? AND password = ?", (form_user, hashed_password), True)
        if user_data == None:
            return Response(u'Authorization failed', mimetype='text/plain', status=401)(environ, start_response)

        expires = int(time.time()) + 3600
        # Credentials are valid. Now, we generate a token.
        token_object = {
            "username": form_user,
            "authenticates": user_data[0],
            "expiry": expires,
            "random_str": secrets.token_urlsafe(32)
        }

        token = sha256(token_object.__str__().encode('utf-8')).hexdigest()
        self.action_query("INSERT INTO sessions (token, identifies, username, expires) VALUES (?, ?, ?, ?)",
                          (token, user_data[0], form_user, expires))
        return Response(json.dumps({"status": "success", "token": token, "expires": expires, "username": form_user }), mimetype='application/json', status=200)(environ, start_response)

    def create_user(self, environ, start_response):
        request = Request(environ)
        form_user = request.form.get('username')
        form_pass = request.form.get('password')
        if form_user is None or form_pass is None:
            return Response(json.dumps({"status": "error", "msg": "Username and/or password were empty." }), mimetype='application/json', status=200)(environ, start_response)
        if len(form_pass) < 8:
            return Response(json.dumps({"status": "error", "msg": "Password must be at least 8 characters in length." }), mimetype='application/json', status=200)(environ, start_response)
        if not form_user.isalnum():
            return Response(json.dumps({"status": "error", "msg": "The username must be alphanumeric." }), mimetype='application/json', status=200)(environ, start_response)            
        if self.query_db("SELECT id FROM users WHERE username = ?", (form_user,), True) is not None:
            return Response(json.dumps({"status": "error", "msg": "Username is already taken." }), mimetype='application/json', status=200)(environ, start_response)
        salt = secrets.token_urlsafe(16)
        hashed_password = sha256(
            (form_pass + salt).encode('utf-8')).hexdigest()
        self.action_query("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)",
                          (form_user, hashed_password, salt))
        return Response(json.dumps({"status": "success", "msg": "The user, " + form_user + " has been created." }), mimetype='application/json', status=200)(environ, start_response)

    def __call__(self, environ, start_response):
        request = Request(environ)
        token = request.headers.get('TOKEN')
        print(request.path)
        if request.path == '/authenticate':
            return self.generate_token(environ, start_response)
        elif request.path == '/new_account':
            return self.create_user(environ, start_response)
        self.action_query(
            "DELETE FROM sessions WHERE expires < ?", (int(time.time()),))
        user_data = self.authenticate(token)
        if user_data != False:
            environ['user_var'] = {
                'username': user_data["username"], 'id': user_data["id"]}
            return self.app(environ, start_response)
        res = Response(u'Authorization failed',
                       mimetype='text/plain', status=401)
        return res(environ, start_response)
