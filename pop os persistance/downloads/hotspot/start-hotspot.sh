#!/bin/bash
if ! [ $(id -u) = 0 ]; then
    echo "Run as root!"
    exit 1
fi

echo Assigning IP to wireless interface
ip addr add 192.168.16.254/24 broadcast 192.168.16.255 dev wlo1

echo Starting DHCP Server
systemctl start isc-dhcp-server

trap "echo Unassigning IP from wireless interface" SIGINT
hostapd hostapd.conf
ip addr del 192.168.16.254/24 broadcast 192.168.16.255 dev wlo1

echo Stopping DHCP Server
systemctl stop isc-dhcp-server
