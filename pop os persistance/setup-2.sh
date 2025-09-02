#!/bin/bash

aria2c https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install ./google-chrome-stable_current_amd64.deb
rm ./google-chrome-stable_current_amd64.deb

cp -r ./.ssh        /home/sidhartha426
cp -r ./SSH\ Keys/  /home/sidhartha426

chmod -R 400 /home/sidhartha426/SSH\ Keys/*
chmod 755 /home/sidhartha426/SSH\ Keys/Github
chmod 755 /home/sidhartha426/SSH\ Keys/Docker

cat ./smb.conf >> /etc/samba/smb.conf
	
ufw enable
ufw allow from 192.168.0.0/16 
ufw allow from 172.16.0.0/12 
ufw status

usermod -aG docker sidhartha426
usermod -aG libvirt sidhartha426
usermod -aG kvm sidhartha426

echo country=US >> /etc/wpa_supplicant/wpa_supplicant.conf
echo 'INTERFACESv4="wlo1"' >> /etc/default/isc-dhcp-server

systemctl unmask hostapd
systemctl disable hostapd
systemctl disable isc-dhcp-server

rm /usr/sbin/hostapd 
rm /usr/sbin/hostapd_cli

cp ./hostapd/hostapd_cli /usr/sbin
cp ./hostapd/hostapd /usr/sbin

cat ./dhcpd.conf >> /etc/dhcp/dhcpd.conf
cat ./bashrc.txt >> /home/sidhartha426/.bashrc

cp ./templets/* /home/sidhartha426/Templates


