FROM alpine
WORKDIR /root


RUN apk update
RUN apk add openssh bash nano


RUN echo "root:admin@1234" | chpasswd
RUN echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
COPY host-keys /etc/ssh
RUN chmod 400 /etc/ssh/ssh_host*


RUN mkdir .ssh
COPY authorized_keys ./.ssh
COPY config ./.ssh
RUN chmod 600 ./.ssh/*


COPY auth-keys ./auth-keys
RUN chmod 400 ./auth-keys/*


COPY start.sh .
RUN chmod +x start.sh
CMD ["bash","start.sh"]
