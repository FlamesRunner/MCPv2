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

Request: POST /status

The server's power level will be returned.

Responses:
- `{ "status": "success", "power_level": ("on" or "off") }`

## Console output

Request: GET /log

The server's console output will be returned.

Responses:
- `{ "status": "success", "log": "console output" }`