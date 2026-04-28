#!/bin/bash

# Wolfi security setup - Change ownership to non-root user (65532:65532)
echo "Setting up Wolfi security permissions..."

# Create necessary directories if they don't exist
mkdir -p /usr/share/logstash/data
mkdir -p /var/log

# Change ownership of log volumes and Logstash data directory
#chown -R 65532:65532 /var/log
#chown -R 65532:65532 /usr/share/logstash/data

#echo "Permissions set for user 65532:65532"

# Wait for Kibana to be ready
echo "Waiting for Kibana to be available..."
until curl -s -k -f https://kibana:5601/api/status > /dev/null; do
  echo "Waiting for Kibana..."
  sleep 5
done

echo "Kibana is ready. Creating Data Views..."

# Kibana API credentials
KIBANA_USER="elastic"
KIBANA_PASS="${ELASTIC_PASSWORD}"

# Create Data View for syslog logs
curl -s -X POST -k \
  -u "${KIBANA_USER}:${KIBANA_PASS}" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  https://kibana:5601/api/data_views/data_view \
  -d '{
    "data_view": {
      "title": "logstash-syslog-*",
      "name": "Syslog Logs",
      "timeFieldName": "@timestamp",
      "id": "logstash-syslog"
    }
  }'

echo "Created Syslog Data View"

# Create Data View for file logs
curl -s -X POST -k \
  -u "${KIBANA_USER}:${KIBANA_PASS}" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  https://kibana:5601/api/data_views/data_view \
  -d '{
    "data_view": {
      "title": "logstash-file-*",
      "name": "File Logs",
      "timeFieldName": "@timestamp",
      "id": "logstash-file"
    }
  }'

echo "Created File Data View"

# Create Data View for journald logs
# curl -s -X POST -k \
#   -u "${KIBANA_USER}:${KIBANA_PASS}" \
#   -H "Content-Type: application/json" \
#   -H "kbn-xsrf: true" \
#   "https://kibana:5601/api/data_views/data_view" \
#   -d '{
#     "data_view": {
#        "title": "podman-logs-*",
#        "name": "Podman Journald Logs",
#        "timeFieldName": "@timestamp",
#        "id": "podman-journald",
#        "namespaces": ["default"]
#     }
#   }'

# echo "Created Journald Data View"

echo "Kibana auto-provisioning completed"
