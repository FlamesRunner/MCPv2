import sqlite3
from flask import g
from dotenv import dotenv_values
from werkzeug.wrappers import Request, Response, ResponseStream

class AuthenticationMiddleware():
    '''
    Authentication middleware
    '''
    env_variables = {}

    def __init__(self, app):
        self.app = app
        self.env_variables = dotenv_values(".env")

    def authenticate(self, token: str):
        if self.env_variables.get('MASTER_TOKEN') == token:
            return "root"
        data = self.query_db("SELECT * FROM servers WHERE token=?", (token,), True)
        if data == None:
            return False
        # Return username
        return data[1]

    # Database fetch
    def query_db(self, query, args=(), single=False):
        cur = sqlite3.connect("./node.db").execute(query, args)
        rv = cur.fetchall()
        cur.close()
        return (rv[0] if rv else None) if single else rv

    def __call__(self, environ, start_response):
        request = Request(environ)
        token = request.headers.get('TOKEN')

        # these are hardcoded for demonstration
        # verify the username and password from some database or env config variable
        user = self.authenticate(token)
        if user is not False:
            environ['user_var'] = { 'username': user }
            return self.app(environ, start_response)
        res = Response(u'Authorization failed',
                        mimetype='text/plain', status=401)
        return res(environ, start_response)
