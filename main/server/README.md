# Master API documentation

# Authentication

All requests must bear a token in the header. Specifically, with key "token" and the value being your server token. The only exception is the route used to obtain a token.

One may authorize their client and obtain a token by making a `POST` request to `/authenticate` with the parameters:
- username
- password

If your authentication request is successful, you will receive the response:

    {
        "status": "success",
        "token": "tokenGoesHere",
        "expires": unixTimestamp
    }

Otherwise, you will receive a `401 Authorization failed` error with an HTTP code of `401`.

# Responses

All responses are returned as JSON, containing:
- status: "success" or "error"
- if status == "error", then a corresponding `msg` is returned describing the error
- call-specific information


## Starting server

Request: POST /api/start with parameters (server_id).
- server_id is the server ID used internally

The server will start if there is no running instance.

Responses:
- `{ "status": "success" }`
- `{ "status": "error", "msg": "Server is already running." }`
- `{ "status": "error", "msg": "Server could not be found." }`
- `{ "status": "error", "msg": "No server ID specified." }`

## Stopping server

Request: POST /api/stop with parameters (server_id).
- server_id is the server ID used internally

The server will stop if there is a running instance.

Responses:
- `{ "status": "success" }`
- `{ "status": "error", "msg": "Server is not running." }`
- `{ "status": "error", "msg": "Server could not be found." }`
- `{ "status": "error", "msg": "No server ID specified." }`

## Sending commands

Request: POST /api/console/cmd with parameters (cmd, server_id)
    - cmd is the command to send to the Minecraft server
    - server_id is the server ID used internally

The server will execute the command if there is a running instance.

Responses:
- `{ "status": "success" }`
- `{ "status": "error", "msg": "Server is not running." }`
- `{ "status": "error", "msg": "Server could not be found." }`
- `{ "status": "error", "msg": "No server ID specified." }`

## Killing server

Request: POST /api/kill with parameters (server_id).
- server_id is the server ID used internally

The server will be killed if there is a running instance.

Responses:
- `{ "status": "success" }`
- `{ "status": "error", "msg": "Server is not running." }`
- `{ "status": "error", "msg": "Server could not be found." }`
- `{ "status": "error", "msg": "No server ID specified." }`

## Server status

Request: GET /api/status

The server's power level will be returned.

Responses:
- `{ "status": "success", "power_level": ("on" or "off") }`
- `{ "status": "error", "msg": "Server could not be found." }`
- `{ "status": "error", "msg": "No server ID specified." }`

## Console output

Request: GET /api/console/log

The server's console output will be returned.

Responses:
- `{ "status": "success", "log": "console output" }`
- `{ "status": "error", "msg": "Server could not be found." }`
- `{ "status": "error", "msg": "No server ID specified." }`