#!/bin/bash
usage() {
        echo "Usage: $0 server_name"
}

if [ -z "$1" ]; then
        usage
        exit 1
fi

if [[ $(id -u) -ne 0 ]] ; then
        echo "Script must be run as root."
        exit 1
fi

if [ ! -d "/home/$1" ]; then
        exit "Home directory /home/$1 does not exist."
        set -e 1
fi

if ! id -u "$1" >/dev/null 2>&1; then
        echo "User (server) $1 does not exist."
        exit 1
fi

pkill -9 -u "$1"
userdel $1
rm -rf /home/$1
exit 0