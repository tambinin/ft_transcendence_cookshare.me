#!/bin/bash

/usr/local/bin/cmd.sh

echo "Waiting for Elasticsearch availability"

until curl -s --cacert config/certs/ca/ca.crt -u "elastic:${ELASTIC_PASSWORD}" -f https://es01:9200 | grep -q "You Know, for Search"; do
    sleep 5
    if curl -s --cacert config/certs/ca/ca.crt -u "elastic:${ELASTIC_PASSWORD}" https://es01:9200 | grep -q "401"; then
        echo "Authentication failed."
        exit 1
    fi
    echo "Still waiting for Elasticsearch..."
done

echo "Setting kibana_system password"

until curl -s -X POST --cacert config/certs/ca/ca.crt -u "elastic:${ELASTIC_PASSWORD}" -H "Content-Type: application/json" https://es01:9200/_security/user/kibana_system/_password -d "{\"password\":\"${KIBANA_PASSWORD}\"}" | grep -q "^{}"; do 
    sleep 5
    echo "Retrying kibana_system password setting..."
done

echo "Creating ILM policy for log retention (30 days)"

curl -s -X PUT --cacert config/certs/ca/ca.crt -u "elastic:${ELASTIC_PASSWORD}" -H "Content-Type: application/json" https://es01:9200/_ilm/policy/logs-retention-policy -d "{
          \"policy\": {
            \"phases\": {
              \"hot\": {
                \"min_age\": \"0ms\",
                \"actions\": {
                  \"rollover\": {
                    \"max_age\": \"7d\",
                    \"max_size\": \"50gb\"
                  }
                }
              },
              \"warm\": {
                \"min_age\": \"7d\",
                \"actions\": {
                  \"shrink\": {
                    \"number_of_shards\": 1
                  },
                  \"forcemerge\": {
                    \"max_num_segments\": 1
                  }
                }
              },
              \"delete\": {
                \"min_age\": \"30d\",
                \"actions\": {
                  \"delete\": {}
                }
              }
            }
          }
        }";

echo "Creating index template with ILM policy"

curl -s -X PUT --cacert config/certs/ca/ca.crt -u "elastic:${ELASTIC_PASSWORD}" -H "Content-Type: application/json" https://es01:9200/_index_template/logstash-template -d "{
          \"index_patterns\": [\"logstash-*\"],
          \"template\": {
            \"settings\": {
              \"index.lifecycle.name\": \"logs-retention-policy\",
              \"index.lifecycle.rollover_alias\": \"logstash\"
            }
          }
        }";

exec echo "All done!"