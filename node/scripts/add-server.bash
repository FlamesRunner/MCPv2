#!/bin/bash
usage() {
        echo "Usage: $0 server_name"
}

if [ -z "$1" ]; then
        usage
        exit
fi

if [[ $(id -u) -ne 0 ]] ; then
        echo "Script must be run as root."
        exit 1
fi

if [ -d "/home/$1" ]; then
        echo "Home directory /home/$1 already taken."
        exit 1
fi

if id -u "$1" >/dev/null 2>&1; then
        echo "User (server) $1 already exists."
        exit 1
fi

echo "Creating user..."
useradd -m -k /var/local/mcp-service/mcp-skel $1
chown root:root /home/$1/server_start
chmod 755 /home/$1/server_start
TOKEN=$(openssl rand -base64 32)
sqlite3 /var/local/mcp-service/daemon/node.db "INSERT INTO servers (token, user) VALUES (\"$TOKEN\", \"$1\")"
echo "Server created. Token: $TOKEN"
