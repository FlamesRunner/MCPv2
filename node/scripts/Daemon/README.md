# Node API documentation

# Authentication

All requests must bear a token in the header. Specifically, with key "token" and the value being your server token.

# Responses

All responses are returned as JSON, containing:
    - status: "success" or "error"
    - if status == "error", then a corresponding `msg` is returned describing the error
    - call-specific information

## Starting server

Request: POST /start with parameters (min_ram, max_ram).
- min_ram/max_ram are strings formatted as:
  - memory_size + order
  - ex. 1024M or 1G or 512M etc

The server will start if there is no running instance. 

Responses:
- `{ "status": "success" }`
- `{ "status": "error", "msg": "max_ram/min_ram not specified" }`
- `{ "status": "error", "msg": "Server is already running." }`

## Stopping server

Request: POST /stop

The server will stop if there is a running instance. 

Responses:
- `{ "status": "success" }`
- `{ "status": "error", "msg": "Server is not running." }`

## Sending commands

Request: POST /cmd with parameters (cmd)
    - cmd is the command to send to the Minecraft server

The server will execute the command if there is a running instance. 

Responses:
- `{ "status": "success" }`
- `{ "status": "error", "msg": "Server is not running." }`

## Killing server

Request: POST /kill

The server will be killed if there is a running instance. 

Responses:
- `{ "status": "success" }`
- `{ "status": "error", "msg": "Server is not running." }`

## Server status

Request: GET /status

The server's power level will be returned.

Responses:
- `{ "status": "success", "power_level": ("on" or "off") }`

## Console output

Request: GET /log

The server's console output will be returned.

Responses:
- `{ "status": "success", "log": "console output" }`

## Get all servers (Master token required)

Request: GET /list_all

All servers will be returned. 

Responses:
  - `{ "status": "success", "servers": [[id, username, token]] }`

Note that:
  - The token is the server's token (not the master token)
  - The username is the server's owner (alphanumeric, 8-16 characters)
  - The id is the server ID (integer)

## Create a new server (Master token required)

Request: POST /create with parameters (username)
  - username is the server's owner (alphanumeric, 8-16 characters)

A server with the given username will be created if there is no server with the same username.

Responses:
  - `{ "status": "success", "msg": "Server successfully created.", "token": "servertoken" }`
  - `{ "status": "error", "msg": "User already exists." }`
  - `{ "status": "error", "msg": "Error: <error message>" }`

## Delete a server (Master token required)

Request: POST /delete with parameters (username)
- username is the server's owner (alphanumeric, 8-16 characters)

A server with the given username will be deleted if there is a server with the same username.

Responses:
  - `{ "status": "success" }`
  - `{ "status": "error", "msg": "Server does not exist." }`
  - `{ "status": "error", "msg": "Error: Your server could not be deleted." }`