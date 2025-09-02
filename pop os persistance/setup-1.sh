#!/bin/bash

cp ./apt/docker.asc  /etc/apt/trusted.gpg.d
cp ./apt/microsoft.asc  /etc/apt/trusted.gpg.d

cp ./apt/docker.list  /etc/apt/sources.list.d
cp ./apt/vscode.list  /etc/apt/sources.list.d


curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh
bash nodesource_setup.sh
add-apt-repository ppa:unit193/encryption -y


