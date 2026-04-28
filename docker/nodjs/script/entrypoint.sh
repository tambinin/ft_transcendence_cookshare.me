#!/bin/sh

rm -f /usr/src/app/allset

set -e

echo "*-----------------------------------*"
echo "Checking node utilities..."
# Skip global install - use local packages via npx instead
# echo "Using local npx for typescript, ts-node, prisma"
echo "Installing global node utilities..."
npm install -g typescript ts-node prisma
echo "*-----------------------------------*"

# Install dependencies if node_modules doesn't exist or is corrupted/incompatible
if [ ! -d "node_modules" ]; then
  echo "Dependencies missing. Performing clean install..."
  rm -rf node_modules
  npm install
fi

echo "*-----------------------------------*"
echo "Generating Prisma Clients for all services..."

# Use the root script to generate all clients via workspaces
npm run prisma:generate

echo "*-----------------------------------*"

# Start the application
echo "*-----------------------------------*"
echo "Starting application..."
touch /usr/src/app/allset
echo "*-----------------------------------*"

sleep 15

echo "*-----------------------------------*"
echo "All set!"
echo "*-----------------------------------*"

exit 0