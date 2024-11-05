#!/bin/bash

# Install nginx
sudo yum install nginx -y

# Copy nginx configuration
sudo cp nginx/colreg.conf /etc/nginx/conf.d/

# Create directory for frontend files
sudo mkdir -p /var/www/colreg-assistant
sudo chown -R ec2-user:ec2-user /var/www/colreg-assistant

# Copy frontend files
cp -r frontend/* /var/www/colreg-assistant/frontend/

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx