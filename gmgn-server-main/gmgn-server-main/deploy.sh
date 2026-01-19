#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Clone repo (if not already cloned)
# git clone https://github.com/anshuman008/gmgn-server.git
# cd gmgn-server

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    read -p "Enter your DATABASE_URL: " DB_URL
    echo "DATABASE_URL=$DB_URL" > .env
fi

# Build and run
docker compose -f docker-compose.prod.yml up -d --build

echo "Deployment complete! Server running on port 8000."
