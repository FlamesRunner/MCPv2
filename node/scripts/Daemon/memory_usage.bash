#!/bin/bash
if [ -z $1 ]; then
	echo "Usage: $0 user"
	exit
fi

if [ `id -u $1 2>/dev/null || echo -1` -ge 0 ]; then
	ps -U $1 --no-headers -o rss | awk '{ sum+=$1} END {print int(sum/1024)}'
else
	echo "User not valid"
fi
