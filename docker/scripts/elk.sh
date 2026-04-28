#!/bin/bash

# Colors
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  🔐  ${BLUE}ELK Stack: Credentials Setup${NC}                 ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"

CLUSTER_NAME=transcendence

if [ ! -f "docker/elk/.env" ]; then
    echo "Setup elk credentials"

    while true; do
        read -rsp "elastic password: " ELASTIC_PASSWORD
    
        if [ ${#ELASTIC_PASSWORD} -lt 6 ]; then
            echo "Error : The password is too short (minimum 6 characters)."
        
        elif [[ "$input" =~ [[:space:]] ]]; then
            echo "Error : The password must not contain spaces."
        else
            echo
            break
        fi
    done

    while true; do
        read -rsp "kibana password: " KIBANA_PASSWORD
    
        if [ ${#KIBANA_PASSWORD} -lt 6 ]; then
            echo "Error : The password is too short (minimum 6 characters)."
        
        elif [[ "$KIBANA_PASSWORD" =~ [[:space:]] ]]; then
            echo "Error : The password must not contain spaces."
        else
            echo
            break
        fi
    done

    cat >> docker/elk/.env << EOF

# ===============================
# ELK Stack Configuration
# ===============================
ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
KIBANA_PASSWORD=${KIBANA_PASSWORD}
CLUSTER_NAME=${CLUSTER_NAME}
MEM_LIMIT=805306368
EOF

fi

echo -e "\n${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ✅  ${BLUE}ELK Stack: Credentials Saved${NC}                 ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
