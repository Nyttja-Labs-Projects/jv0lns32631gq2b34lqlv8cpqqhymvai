# # Use the i386 Debian Buster base image
# FROM --platform=i386 i386/debian:buster

# # Set environment variable to suppress interactive prompts during package installations
# ARG DEBIAN_FRONTEND=noninteractive

# # Update package lists, upgrade existing packages, and install required packages
# RUN apt-get update && apt-get -y upgrade && \
#     apt-get install -y apt-utils beef bsdgames bsdmainutils ca-certificates clang \
#     cowsay cpio cron curl dmidecode dmsetup g++ gcc gdbm-l10n git  \
#     hexedit ifupdown init logrotate lsb-base lshw lua5.0 luajit lynx make \
#     nano netbase nodejs openssl procps python3 python3-cryptography \
#     python3-jinja2 python3-numpy python3-pandas python3-pip python3-scipy \
#     python3-six python3-yaml readline-common rsyslog ruby sensible-utils \
#     ssh systemd systemd-sysv tasksel tasksel-data udev vim wget whiptail \
#     xxd iptables isc-dhcp-client isc-dhcp-common kmod less netcat-openbsd

# # Install aider using the provided installation script
# RUN curl -LsSf https://aider.chat/install.sh | sh

# # Clone the specified Git repository
# RUN git clone https://github.com/Nyttja-Labs/Template-server-experiment /home/user/template-server-experiment

# # Set the DEEPSEEK_API_KEY environment variable
# ENV DEEPSEEK_API_KEY=sk-abe7ff9cfd704baf8600ffb08e97de22

# # Create a new user named 'user' with password 'password'
# RUN useradd -m user && echo "user:password" | chpasswd

# # Copy the 'examples' directory to the user's home directory and set permissions
# # COPY --chown=user:user ./examples /home/user/examples
# # RUN chmod -R +x /home/user/examples/lua

# # Change root password to 'password'
# RUN echo 'root:password' | chpasswd

# # Switch to the 'user' to run the aider command
# # USER user

# # Set the working directory
# WORKDIR /home/root/template

# # Run the aider command with the specified arguments
# RUN aider \
#     --model deepseek/deepseek-coder \
#     --no-show-model-warnings \
#     --no-browser \
#     --yes \
#     --read CONVENTIONS.md \
#     --auto-commits \
#     --message "Make a simple website"

# # Set the default command to bash
# CMD [ "/bin/bash" ]
