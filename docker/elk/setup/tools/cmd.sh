#!/bin/bash

set -e

mkdir -p config/certs;
echo "Working directory: $(pwd)";

# Create CA certificate
if [ ! -f config/certs/ca.zip ]; then
    echo "Creating CA certificate...";
    if [ ! -f bin/elasticsearch-certutil ]; then
        echo "ERROR: bin/elasticsearch-certutil not found. Make sure you're running this from the elasticsearch container.";
        exit 1;
    fi;
    bin/elasticsearch-certutil ca --silent --pem -out config/certs/ca.zip;
    unzip -o config/certs/ca.zip -d config/certs;
    echo "CA certificate created successfully.";
else
    echo "CA certificate already exists, skipping...";
fi;

# Create instance certificates
if [ ! -f config/certs/certs.zip ]; then
    echo "Creating instance certificates...";
    echo -ne "instances:\n"\
        "  - name: es01\n"\
        "    dns:\n"\
        "      - es01\n"\
        "      - localhost\n"\
        "    ip:\n"\
        "      - 127.0.0.1\n"\
        "  - name: kibana\n"\
        "    dns:\n"\
        "      - kibana\n"\
        "      - localhost\n"\
        "  - name: logstash\n"\
        "    dns:\n"\
        "      - logstash\n"\
        "      - localhost\n"\
        > config/certs/instances.yml;
    
    echo "instances.yml created. Generating certificates...";
    bin/elasticsearch-certutil cert --silent --pem -out config/certs/certs.zip \
        --in config/certs/instances.yml \
        --ca-cert config/certs/ca/ca.crt \
        --ca-key config/certs/ca/ca.key;
    
    unzip -o config/certs/certs.zip -d config/certs;
    echo "Instance certificates created successfully.";
else
    echo "Instance certificates already exist, skipping...";
fi;

echo "Setting file permissions...";
chown -R 1000:0 config/certs;
find . -type d -exec chmod 750 \{\} \;;
find . -type f -exec chmod 640 \{\} \;;
echo "Certificate setup completed successfully!";