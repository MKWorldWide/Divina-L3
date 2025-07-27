# Security Audit Environment for GameDin L3

# Use the official Python image as the base
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    libssl-dev \
    pkg-config \
    libffi-dev \
    libgmp-dev \
    libsecp256k1-dev \
    solc \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (required for some tools)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

# Install Foundry (Forge, Cast, Anvil)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="${PATH}:/root/.foundry/bin"

# Install Slither and other Python tools
RUN pip install --upgrade pip && \
    pip install slither-analyzer \
    mythril \
    manticore \
    echidna-requirements \
    solc-select \
    solcx \
    eth-brownie \
    web3 \
    py-solc-x \
    solc-select \
    pytest \
    pytest-xdist \
    hypothesis \
    eth-typing \
    eth-utils \
    eth-account \
    eth-hash[pycryptodome] \
    ecdsa \
    py_ecc \
    pycryptodome \
    pysha3 \
    rlp \
    semantic-version \
    setuptools \
    wheel

# Install Slither's solc versions
RUN solc-select install 0.8.20 && \
    solc-select install 0.8.19 && \
    solc-select install 0.8.17 && \
    solc-select use 0.8.20

# Install Echidna
RUN wget https://github.com/crytic/echidna/releases/download/v2.2.1/echidna-2.2.1-Ubuntu-18.04.tar.gz && \
    tar -xvzf echidna-2.2.1-Ubuntu-18.04.tar.gz && \
    mv echidna-test /usr/local/bin/ && \
    rm -rf echidna-2.2.1-Ubuntu-18.04.tar.gz echidna-2.2.1

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="${PATH}:/root/.foundry/bin"

# Install Solhint
RUN npm install -g solhint

# Install Solidity Coverage
RUN npm install -g solidity-coverage

# Install Solhint and Solium
RUN npm install -g solhint solium

# Install Slither and other security tools
RUN pip install slither-analyzer \
    mythril \
    manticore \
    echidna-requirements \
    solcx \
    eth-brownie \
    web3 \
    py-solc-x \
    solc-select \
    pytest \
    pytest-xdist \
    hypothesis \
    eth-typing \
    eth-utils \
    eth-account \
    eth-hash[pycryptodome] \
    ecdsa \
    py_ecc \
    pycryptodome \
    pysha3 \
    rlp \
    semantic-version \
    setuptools \
    wheel

# Install Slither's solc versions
RUN solc-select install 0.8.20 && \
    solc-select install 0.8.19 && \
    solc-select install 0.8.17 && \
    solc-select use 0.8.20

# Install Slither's solc versions
RUN solc-select install 0.8.20 && \
    solc-select install 0.8.19 && \
    solc-select install 0.8.17 && \
    solc-select use 0.8.20

# Install Slither's solc versions
RUN solc-select install 0.8.20 && \
    solc-select install 0.8.19 && \
    solc-select install 0.8.17 && \
    solc-select use 0.8.20

# Install Slither's solc versions
RUN solc-select install 0.8.20 && \
    solc-select install 0.8.19 && \
    solc-select install 0.8.17 && \
    solc-select use 0.8.20

# Create a non-root user
RUN useradd -m auditor
USER auditor
WORKDIR /home/auditor

# Set up the project directory
RUN mkdir -p /home/auditor/project
WORKDIR /home/auditor/project

# Copy the project files
COPY . .

# Install project dependencies
RUN npm install

# Set the default command
CMD ["/bin/bash"]
