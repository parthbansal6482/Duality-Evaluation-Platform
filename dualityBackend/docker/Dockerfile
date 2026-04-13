# Multi-language code execution environment
FROM ubuntu:22.04

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install essential tools and compilers
RUN sed -i 's|http://archive.ubuntu.com/ubuntu/|http://mirrors.edge.kernel.org/ubuntu/|g' /etc/apt/sources.list \
    && apt-get update && apt-get install -y \
    # Build essentials
    build-essential \
    # Python
    python3 \
    python3-pip \
    # Node.js
    curl \
    # Java
    openjdk-17-jdk \
    # C/C++
    gcc \
    g++ \
    # Utilities
    time \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create execution directory
RUN mkdir -p /code && chmod 777 /code
WORKDIR /code

# Create non-root user for security
RUN useradd -m -u 1000 coderunner && \
    chown -R coderunner:coderunner /code

# Switch to non-root user
USER coderunner

# Set resource limits
ENV TIMEOUT=10

# Default command
CMD ["/bin/bash"]
