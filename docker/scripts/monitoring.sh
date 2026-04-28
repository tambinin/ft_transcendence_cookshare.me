#!/bin/bash

# Colors
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  🔐  ${BLUE}Monitoring Stack: Credentials Setup${NC}          ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"

if [ ! -f "docker/monitoring/.env" ]; then

    echo "Setup Grafana credentials"

    read -rp "grafana admin: " ADMIN

    while true; do
        read -rsp "grafana password: " PASSW
        echo
    
        if [ ${#PASSW} -lt 6 ]; then
            echo "Error : The password is too short (minimum 6 characters)."
        
        elif [[ "$PASSW" =~ [[:space:]] ]]; then
            echo "Error : The password must not contain spaces."
        else
            echo
            break
        fi
    done

    cat >> docker/monitoring/.env << EOF

# ===============================
# monitoring Configuration
# ===============================
ADMIN=${ADMIN}
PASSW=${PASSW}
EOF

fi

echo -e "\n${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ✅  ${BLUE}Monitoring Stack: Credentials Saved${NC}          ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
