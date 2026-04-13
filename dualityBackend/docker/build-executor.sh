#!/bin/bash

# Build the code executor image
echo "Building code-executor:latest..."

# Navigate to the directory containing the Dockerfile
# This script is intended to be run from the server/docker directory or from the root with the path to the directory
DOCKER_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

docker build -t code-executor:latest "$DOCKER_DIR"

if [ $? -eq 0 ]; then
    echo "Successfully built code-executor:latest ✅"
else
    echo "Failed to build code-executor:latest ❌"
    exit 1
fi
