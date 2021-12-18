#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
	echo "Usage: $0 <user> <new-password>"
	exit 1
fi

echo -e "$2\n$2" | passwd $1
