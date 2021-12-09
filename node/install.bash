#!/bin/bash
echo ">>> Checking system..."
sleep 2
if [ ! -f "/etc/debian_version" ]; then
        echo ">>> ERR: The node software is only compatible with Debian based systems."
        exit 1
fi

if [[ $(id -u) -ne 0 ]] ; then
        echo ">>> ERR: The installation script must be run as root."
        exit 1
fi

echo ">>> Installing prerequisite for installer checks..."
sleep 2
apt-get install -y bc

DEBIAN_VERSION=$(cat /etc/debian_version)
if (( $(echo "$DEBIAN_VERSION < 10" | bc -l) )); then
        echo "You must be running Debian 10.x."
        exit 1
fi

echo ">>> Installing prerequisites..."
sleep 2
apt-get install -y git python3 python3-pip sqlite3 curl wget python3-flask nginx openssl openjdk-11-jre openssh-server

echo ">>> Installing build tools..."
sleep 2
apt-get install -y build-essential gcc

echo ">>> Cloning repository to a temporary directory..."
sleep 2
cd /tmp && git clone https://github.com/FlamesRunner/MCPv2

echo ">>> Copying requisite files..."
sleep 2
cp -R /tmp/MCPv2/node ~/mcp-node-files
rm -rf /tmp/MCPv2

echo ">>> Building server wrapper..."
sleep 2
cd ~/mcp-node-files/scripts
make

echo ">>> Generating skeleton directory..."
sleep 2
cd ~
mkdir mcp-skel
cp -R ~/mcp-node-files/server ~/mcp-skel/server
cp ~/mcp-node-files/scripts/server_start ~/mcp-skel/server_start
chmod 700 ~/mcp-skel/server_start

echo ">>> Creating service directory..."
sleep 2
mkdir /var/local/mcp-service
cp -R ~/mcp-skel /var/local/mcp-service/mcp-skel
cp -R ~/mcp-node-files/scripts/Daemon /var/local/mcp-service/daemon
cp ~/mcp-node-files/scripts/add-server.bash ~
chmod +x /var/local/mcp-service/daemon/*.bash

echo ">>> Installing Flask..."
sleep 2
cd /var/local/mcp-service/daemon
pip3 install flask

echo ">>> Creating systemd service..."
sleep 2
cd /var/local/mcp-service/daemon
cat <<EOT > daemon_start.sh
#!/bin/bash
# flask settings
cd /var/local/mcp-service/daemon
export FLASK_APP=Daemon.py
export FLASK_DEBUG=0

flask run --host=127.0.0.1 --port=5001
EOT
chmod +x /var/local/mcp-service/daemon/daemon_start.sh

cat <<EOT > /etc/systemd/system/mcp-node.service
[Unit]
Description = Starts MCP Node API

[Service]
ExecStart = /var/local/mcp-service/daemon/daemon_start.sh

[Install]
WantedBy = multi-user.target
EOT

echo ">>> Enabling startup execution..."
sleep 2
systemctl enable mcp-node.service

echo ">>> Configuring OpenSSH to allow jailed SFTP for users..."
sleep 2
echo <<EOT > /etc/ssh/sshd_config.d/mcp-jailed-sftp.conf
Match Group mcpuser
	ForceCommand internal-sftp
	ChrootDirectory /home/%u
	AllowTCPForwarding no
	X11Forwarding no 
EOT

echo ">>> Adding jailed SFTP group..."
sleep 2
groupadd mcpuser

echo ">>> Generating SSL certificates..."
echo ">>> When prompted for the FQDN, enter your public IP address."

PUBLIC_IP=$(curl -s icanhazip.com)
echo ">>> For your convenience, here is a guess of your public IP: $PUBLIC_IP"
sleep 2
mkdir /etc/nginx/ssl
openssl req -x509 -nodes -days 1000 -newkey rsa:4096 -keyout /etc/nginx/ssl/cert.key -out /etc/nginx/ssl/cert.pem

echo ">>> Generating dhparam file. This may take a while."
sleep 2
openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048

echo ">>> Configuring NGINX..."
sleep 2
cat <<EOT > /etc/nginx/sites-available/mcp-node
server {
        listen 5000 ssl;
        listen [::]:5000 ssl;
        location / {
                proxy_pass http://localhost:5001;
        }
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_dhparam /etc/nginx/ssl/dhparam.pem;
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/cert.key;
}
EOT

echo ">>> Enabling new NGINX configuration..."
sleep 2
ln -s /etc/nginx/sites-available/mcp-node /etc/nginx/sites-enabled/mcp-node
systemctl restart nginx

echo ">>> Starting daemon..."
sleep 2
systemctl start mcp-node
systemctl restart ssh

echo " "
echo " "
echo ">>> Installation complete. Please note the following:"
echo ">>> Daemon service: mcp-node"
echo ">>> To start/restart/etc: systemctl start mcp-node, systemctl stop mcp-node"
echo ">>> There is a web proxy configured to connect to the daemon (NGINX) that listens on port 5000. This is your API server."
echo " "
echo " "
