#!/bin/bash

if [ $(id -u) = 0 ]; then
    echo "Run as non-root user!"
    exit 1
fi


if [ ! -d "/media/sidhartha426/Nana" ]; then
    echo "Please plug in Hard Disk."
    exit 1
fi


rm -r /home/sidhartha426/.cache/rygel/*
cp ./media-export.db /home/sidhartha426/.cache/rygel


trap "echo -n" SIGINT
rygel -UD --config=./rygel.conf

rygel -s
rm -r /home/sidhartha426/.cache/rygel/*
