#!/bin/sh

# Script for the automated initialization of Vault for the prod

# ============================================
# VAULT PRODUCTION CLUSTER INITIALIZATION
# ============================================
# This script initializes a 3-node Raft cluster, configures AppRole,
# loads secrets from secrets.env, and sets up policies and roles.
#
# TLS is handled via environment variables set in docker-compose:
#   VAULT_CACERT=/vault/tls/vault-cert.pem
#   VAULT_SKIP_VERIFY=true (for self-signed certs)
# No need to pass -ca-cert flags to vault commands.

set -e # Exit on any error

# Configuration
VAULT_ADDR_1="https://vault-1:8200"
VAULT_ADDR_2="https://vault-2:8200"
VAULT_ADDR_3="https://vault-3:8200"
SECRETS_FILE="/vault/secrets/secrets.env"
KEYS_DIR="/vault/keys"
APPROLE_DIR="/vault/approle"
MAX_RETRY=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color 

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN} $1${NC}"
}
error() {
    echo -e "${RED} $1${NC}"
}
warning() {
    echo -e "${YELLOW} $1${NC}"
}

# ============================================
# STEP 1: Wait for all Vault nodes to be ready
# ============================================
log "Step 1: Waiting for all Vault nodes to be ready..."
for addr in $VAULT_ADDR_1 $VAULT_ADDR_2 $VAULT_ADDR_3; do
    log " Waiting for $addr..."
    RETRY=0
    while true; do
        set +e
        vault status -address=$addr > /dev/null 2>&1
        STATUS=$?
        set -e
        # 0 = unsealed, 2 = sealed but responding
        if [ $STATUS -eq 0 ] || [ $STATUS -eq 2 ]; then
            break
        fi
        RETRY=$((RETRY + 1))
        if [ $RETRY -ge $MAX_RETRY ]; then
            error "Timed out waiting for $addr after ${MAX_RETRY} retries"
            exit 1
        fi
        sleep 2
    done
    success " $addr is ready!"
done

# ============================================
# STEP 2: Initialize cluster (only once)
# ============================================
log "Step 2: Initializing Vault cluster (only on the first node)..."

set +e
INIT_OUTPUT=$(vault operator init \
    -address=$VAULT_ADDR_1 \
    -key-shares=5 \
    -key-threshold=3 \
    2>&1)
INIT_EXIT_CODE=$?
set -e

if echo "$INIT_OUTPUT" | grep -q "Vault is already initialized"; then
    success "Cluster already initialized. Skipping initialization step."
    success "Unseal keys should already exist in $KEYS_DIR"
elif [ $INIT_EXIT_CODE -ne 0 ]; then
    error "Failed to initialize Vault cluster"
    echo "$INIT_OUTPUT"
    exit 1
else
    mkdir -p $KEYS_DIR
    echo "$INIT_OUTPUT" > $KEYS_DIR/init-output.txt

    log " Extracting keys from text output..."

    echo "$INIT_OUTPUT" | grep "Unseal Key 1:" | awk '{print $NF}' > $KEYS_DIR/unseal-key-1.txt
    echo "$INIT_OUTPUT" | grep "Unseal Key 2:" | awk '{print $NF}' > $KEYS_DIR/unseal-key-2.txt
    echo "$INIT_OUTPUT" | grep "Unseal Key 3:" | awk '{print $NF}' > $KEYS_DIR/unseal-key-3.txt
    echo "$INIT_OUTPUT" | grep "Unseal Key 4:" | awk '{print $NF}' > $KEYS_DIR/unseal-key-4.txt
    echo "$INIT_OUTPUT" | grep "Unseal Key 5:" | awk '{print $NF}' > $KEYS_DIR/unseal-key-5.txt

    echo "$INIT_OUTPUT" | grep "Initial Root Token:" | awk '{print $NF}' > $KEYS_DIR/root-token.txt

    log " Validating extracted keys and token..."
    VALIDATION_FAILED=false

    for i in 1 2 3 4 5; do
        if [ ! -s "$KEYS_DIR/unseal-key-$i.txt" ]; then
            error "Unseal key $i is empty or missing"
            VALIDATION_FAILED=true
        fi
    done

    if [ ! -s "$KEYS_DIR/root-token.txt" ]; then
        error "Root token is empty or missing"
        VALIDATION_FAILED=true
    fi

    if [ "$VALIDATION_FAILED" = true ]; then
        error "Key extraction failed. Output saved in $KEYS_DIR/init-output.txt"
        cat $KEYS_DIR/init-output.txt
        exit 1
    fi

    success "Cluster initialized with 5 unseal keys and root token"
fi

# ============================================
# STEP 3: Unseal all nodes
# ============================================
log "Step 3: Unsealing all nodes..."
KEY1=$(cat $KEYS_DIR/unseal-key-1.txt)
KEY2=$(cat $KEYS_DIR/unseal-key-2.txt)
KEY3=$(cat $KEYS_DIR/unseal-key-3.txt)

# Unseal vault-1 first (the leader)
log " Unsealing $VAULT_ADDR_1..."
set +e
vault operator unseal -address=$VAULT_ADDR_1 $KEY1 >/dev/null 2>&1
vault operator unseal -address=$VAULT_ADDR_1 $KEY2 >/dev/null 2>&1
vault operator unseal -address=$VAULT_ADDR_1 $KEY3 >/dev/null 2>&1
set -e
success " $VAULT_ADDR_1 unsealed!"

# Wait for vault-1 to be fully unsealed
log " Waiting for vault-1 to be unsealed..."
RETRY=0
while true; do
    set +e
    vault status -address=$VAULT_ADDR_1 2>/dev/null | grep -q "Sealed.*false"
    RESULT=$?
    set -e
    if [ $RESULT -eq 0 ]; then
        break
    fi
    RETRY=$((RETRY + 1))
    if [ $RETRY -ge $MAX_RETRY ]; then
        error "Timed out waiting for vault-1 to unseal"
        vault status -address=$VAULT_ADDR_1 2>&1 || true
        exit 1
    fi
    sleep 2
done
success " vault-1 is unsealed!"

# Authenticate so raft commands work
export VAULT_TOKEN=$(cat $KEYS_DIR/root-token.txt)
export VAULT_ADDR=$VAULT_ADDR_1

# Give raft time to elect a leader
log " Waiting for vault-1 to become the Raft leader..."
RETRY=0
while true; do
    set +e
    vault operator raft list-peers 2>/dev/null | grep -q "leader"
    RESULT=$?
    set -e
    if [ $RESULT -eq 0 ]; then
        break
    fi
    RETRY=$((RETRY + 1))
    if [ $RETRY -ge $MAX_RETRY ]; then
        warning "Raft leader not detected yet, continuing anyway..."
        break
    fi
    sleep 2
done

# Now unseal vault-2 and vault-3
# First wait for each node to be initialized (= joined the Raft cluster)
for addr in $VAULT_ADDR_2 $VAULT_ADDR_3; do
    log " Waiting for $addr to join the cluster (Initialized=true)..."
    RETRY=0
    while true; do
        set +e
        vault status -address=$addr 2>/dev/null | grep -q "Initialized.*true"
        RESULT=$?
        set -e
        if [ $RESULT -eq 0 ]; then
            break
        fi
        RETRY=$((RETRY + 1))
        if [ $RETRY -ge $MAX_RETRY ]; then
            warning "$addr did not join cluster in time, trying unseal anyway..."
            break
        fi
        sleep 3
    done
    success " $addr has joined the cluster!"

    log " Unsealing $addr..."
    set +e
    vault operator unseal -address=$addr $KEY1 2>&1 || true
    vault operator unseal -address=$addr $KEY2 2>&1 || true
    vault operator unseal -address=$addr $KEY3 2>&1 || true
    set -e

    # Verify unseal worked
    RETRY=0
    while true; do
        set +e
        vault status -address=$addr 2>/dev/null | grep -q "Sealed.*false"
        RESULT=$?
        set -e
        if [ $RESULT -eq 0 ]; then
            success " $addr unsealed!"
            break
        fi
        RETRY=$((RETRY + 1))
        if [ $RETRY -ge 15 ]; then
            warning "$addr still sealed after unseal attempts, continuing..."
            break
        fi
        # Retry unseal in case of timing issue
        set +e
        vault operator unseal -address=$addr $KEY1 >/dev/null 2>&1
        vault operator unseal -address=$addr $KEY2 >/dev/null 2>&1
        vault operator unseal -address=$addr $KEY3 >/dev/null 2>&1
        set -e
        sleep 2
    done
done

# ============================================
# STEP 4: Wait for cluster to be fully unsealed
# ============================================
log "Step 4: Waiting for cluster to be fully unsealed..."
for addr in $VAULT_ADDR_1 $VAULT_ADDR_2 $VAULT_ADDR_3; do
    log " Waiting for $addr to be unsealed..."
    RETRY=0
    while true; do
        set +e
        vault status -address=$addr 2>/dev/null | grep -q "Sealed.*false"
        RESULT=$?
        set -e
        if [ $RESULT -eq 0 ]; then
            break
        fi
        RETRY=$((RETRY + 1))
        if [ $RETRY -ge $MAX_RETRY ]; then
            warning "Timed out waiting for $addr to unseal, continuing..."
            break
        fi
        sleep 2
    done
    success " $addr is unsealed!"
done

# ============================================
# STEP 5: Authenticate with root token
# ============================================
log "Step 5: Authenticating with root token..."
export VAULT_TOKEN=$(cat $KEYS_DIR/root-token.txt)
export VAULT_ADDR=$VAULT_ADDR_1

# Wait for full Raft cluster (all 3 nodes) to be ready
# We check via vault status that all nodes are unsealed (raft list-peers
# may return 0 if this node is standby — that's normal in an already-initialized cluster)
log " Verifying cluster health via vault status..."
RETRY=0
CLUSTER_OK=false
while true; do
    set +e
    ALL_UNSEALED=true
    for addr in $VAULT_ADDR_1 $VAULT_ADDR_2 $VAULT_ADDR_3; do
        vault status -address=$addr 2>/dev/null | grep -q "Sealed.*false" || ALL_UNSEALED=false
    done
    set -e
    if [ "$ALL_UNSEALED" = "true" ]; then
        CLUSTER_OK=true
        break
    fi
    RETRY=$((RETRY + 1))
    if [ $RETRY -ge $MAX_RETRY ]; then
        warning "Not all nodes confirmed unsealed after ${MAX_RETRY} retries. Continuing anyway..."
        break
    fi
    log " Waiting for all nodes to be unsealed (attempt ${RETRY}/${MAX_RETRY})..."
    sleep 2
done

success "Authenticated with Vault"

# ============================================
# STEP 6: Load secrets from secrets.env
# ============================================
# log "Step 6: Loading secrets from $SECRETS_FILE..."
# if [ ! -f "$SECRETS_FILE" ]; then
#     # Check if secrets are already loaded in Vault (re-run after fclean without volume wipe)
#     # KV v2: the real data path is ft_transcendence/data/jwt
#     set +e
#     vault kv get -field=jwt_secret -mount=ft_transcendence jwt > /dev/null 2>&1
#     SECRETS_EXIST=$?
#     set -e
#     if [ $SECRETS_EXIST -eq 0 ]; then
#         warning "Secrets file not found but secrets already exist in Vault (persistent volumes). Skipping secret loading."
#     else
#         error "Secrets file not found: $SECRETS_FILE"
#         error "Please mount cybersecurity/vault/secrets/secrets.env into the vault-init container."
#         exit 1
#     fi
# else
#     # Source the secrets file
#     . $SECRETS_FILE
# fi

# if [ -f "$SECRETS_FILE" ]; then

## SOPS ##
log "Step 6: Loading secrets from $SECRETS_FILE or environment (SOPS)..."
SECRETS_FROM_ENV=false
if [ ! -f "$SECRETS_FILE" ]; then
    if [ -n "$JWT_SECRET" ]; then
        # Variables injected by SOPS via environment — no file needed
        warning "secrets.env not found but environment variables detected (SOPS). Continuing."
        SECRETS_FROM_ENV=true
    else
        set +e
        vault kv get -field=jwt_secret -mount=ft_transcendence jwt > /dev/null 2>&1
        SECRETS_EXIST=$?
        set -e
        if [ $SECRETS_EXIST -eq 0 ]; then
            warning "Secrets file not found but secrets already exist in Vault (persistent volumes). Skipping secret loading."
        else
            error "Secrets file not found: $SECRETS_FILE"
            error "Please mount cybersecurity/vault/secrets/secrets.env OR use SOPS to inject variables."
            exit 1
        fi
    fi
else
    . $SECRETS_FILE
fi

if [ -f "$SECRETS_FILE" ] || [ "$SECRETS_FROM_ENV" = "true" ]; then
## SOPS Encrypted Secrets ##


# Activate the kv version 2 engine (Static Secrets Engine v2)
log " Activate the kv engine..."
vault secrets enable -path=ft_transcendence -version=2 kv 2>/dev/null || warning "KV engine already activated"

# Load database credentials
log " Loading the database secret..."
echo "$AUTH_DATABASE_URL" | vault kv put ft_transcendence/database/auth auth_url=-
echo "$RECIPE_DATABASE_URL" | vault kv put ft_transcendence/database/recipe recipe_url=-
echo "$USER_DATABASE_URL" | vault kv put ft_transcendence/database/user user_url=-
echo "$NOTIFICATION_DATABASE_URL" | vault kv put ft_transcendence/database/notification notification_url=-
echo "$CHAT_DATABASE_URL" | vault kv put ft_transcendence/database/chat chat_url=-

# Load API key
log " Loading the API key secret..."
echo "$API_GATEWAY_KEY" | vault kv put ft_transcendence/api/gateway gateway_key=-
echo "$API_MASTER_SECRET" | vault kv put ft_transcendence/api/master master_secret=-

# Load GROQ API key (for RAG service)
log " Loading the GROQ API key secret..."
echo "$GROQ_API_KEY" | vault kv put ft_transcendence/api/groq groq_api_key=-

# Load JWT Secret
log " Loading the JWT secret..."
echo "$JWT_SECRET" | vault kv put ft_transcendence/jwt jwt_secret=-

# Load Cookie Secret
log " Loading the Cookie secret..."
echo "$COOKIE_SECRET" | vault kv put ft_transcendence/cookie cookie_secret=-

# Load Internal API Key
log " Loading the Internal API Key secret..."
echo "$INTERNAL_API_KEY" | vault kv put ft_transcendence/internal_api internal_key=-

# Load Email secrets
log " Loading the Email secrets..."
vault kv put ft_transcendence/email/brevo \
    api_key="$BREVO_API_KEY" \
    smtp_key="$BREVO_SMTP_KEY"

# Load Cloudinary secrets
log " Loading the Cloudinary secrets..."
vault kv put ft_transcendence/cloudinary \
    cloud_name="$CLOUDINARY_CLOUD_NAME" \
    api_key="$CLOUDINARY_API_KEY" \
    api_secret="$CLOUDINARY_API_SECRET" \
    url="$CLOUDINARY_URL" 2>/dev/null || warning "Cloudinary secrets not set, skipping"

# Load Redis secrets
log " Loading the Redis secrets..."
vault kv put ft_transcendence/redis \
    host="${REDIS_HOST:-redis}" \
    port="${REDIS_PORT:-6379}" \
    password="$REDIS_PASSWORD" 2>/dev/null || warning "Redis secrets not set, skipping"

# Load Service URLs
log " Loading the Service URL secrets..."
vault kv put ft_transcendence/config/urls \
    domain="${DOMAIN:-cookshare.me}" \
    cors_origins="${CORS_ORIGINS:-https://cookshare.me,https://www.cookshare.me,https://localhost}" \
    server_url="${SERVER_URL:-https://cookshare.me/api}" \
    api_gateway="${API_GATEWAY_URL:-https://api-gateway:3001}" \
    recipe="${RECIPE_SERVICE_URL:-https://recipe:3002}" \
    auth="${AUTH_SERVICE_URL:-https://auth:3003}" \
    user="${USER_SERVICE_URL:-https://user:3004}" \
    chat="${CHAT_SERVICE_URL:-https://chat:3005}" \
    notification="${NOTIFICATION_SERVICE_URL:-https://notification:3006}" \
    websocket="${WEBSOCKET_SERVICE_URL:-https://websocket:3007}"

# Load Service Ports
log " Loading the Service Port secrets..."
vault kv put ft_transcendence/config/ports \
    api_gateway="3001" \
    recipe="3002" \
    auth="3003" \
    user="3004" \
    chat="3005" \
    notification="3006" \
    websocket="3007"

# Load TLS config
log " Loading the TLS config secrets..."
vault kv put ft_transcendence/config/tls \
    key_path="${TLS_KEY_PATH:-/certs/key.pem}" \
    cert_path="${TLS_CERT_PATH:-/certs/cert.pem}"

# Load Google OAuth secrets
log " Loading Google OAuth secrets..."
vault kv put ft_transcendence/google_oauth \
    client_id="${GOOGLE_CLIENT_ID:-}" \
    client_secret="${GOOGLE_CLIENT_SECRET:-}"

fi # end of: if [ -f "$SECRETS_FILE" ]

# ============================================
# STEP 7: Enable AppRole authentication
# ============================================
log "Step 7: Enabling AppRole authentication..."

vault auth enable approle 2>/dev/null || warning "AppRole already enabled"
 
# ============================================
# STEP 8: Create policies for each service
# ============================================
log " Step 8: Creating policies for each service..."

# Auth service policy
vault policy write auth-policy - <<EOF
path "ft_transcendence/data/database/auth" { capabilities = ["read"] }
path "ft_transcendence/data/jwt" { capabilities = ["read"] }
path "ft_transcendence/data/cookie" { capabilities = ["read"] }
path "ft_transcendence/data/internal_api" { capabilities = ["read"] }
path "ft_transcendence/data/redis" { capabilities = ["read"] }
path "ft_transcendence/data/config/urls" { capabilities = ["read"] }
path "ft_transcendence/data/config/ports" { capabilities = ["read"] }
path "ft_transcendence/data/config/tls" { capabilities = ["read"] }
path "ft_transcendence/data/google_oauth" { capabilities = ["read"] }
EOF

# User service policy
vault policy write user-policy - <<EOF
path "ft_transcendence/data/database/user" { capabilities = ["read"] }
path "ft_transcendence/data/jwt" { capabilities = ["read"] }
path "ft_transcendence/data/cookie" { capabilities = ["read"] }
path "ft_transcendence/data/internal_api" { capabilities = ["read"] }
path "ft_transcendence/data/redis" { capabilities = ["read"] }
path "ft_transcendence/data/config/urls" { capabilities = ["read"] }
path "ft_transcendence/data/config/ports" { capabilities = ["read"] }
path "ft_transcendence/data/cloudinary" { capabilities = ["read"] }
path "ft_transcendence/data/config/tls" { capabilities = ["read"] }
EOF

# Recipe service policy
vault policy write recipe-policy - <<EOF
path "ft_transcendence/data/database/recipe" { capabilities = ["read"] }
path "ft_transcendence/data/jwt" { capabilities = ["read"] }
path "ft_transcendence/data/cookie" { capabilities = ["read"] }
path "ft_transcendence/data/internal_api" { capabilities = ["read"] }
path "ft_transcendence/data/redis" { capabilities = ["read"] }
path "ft_transcendence/data/config/urls" { capabilities = ["read"] }
path "ft_transcendence/data/config/ports" { capabilities = ["read"] }
path "ft_transcendence/data/cloudinary" { capabilities = ["read"] }
path "ft_transcendence/data/config/tls" { capabilities = ["read"] }
EOF

# Chat service policy
vault policy write chat-policy - <<EOF
path "ft_transcendence/data/database/chat" { capabilities = ["read"] }
path "ft_transcendence/data/jwt" { capabilities = ["read"] }
path "ft_transcendence/data/cookie" { capabilities = ["read"] }
path "ft_transcendence/data/internal_api" { capabilities = ["read"] }
path "ft_transcendence/data/redis" { capabilities = ["read"] }
path "ft_transcendence/data/config/urls" { capabilities = ["read"] }
path "ft_transcendence/data/config/ports" { capabilities = ["read"] }
path "ft_transcendence/data/config/tls" { capabilities = ["read"] }
EOF

# Notification service policy
vault policy write notification-policy - <<EOF
path "ft_transcendence/data/database/notification" { capabilities = ["read"] }
path "ft_transcendence/data/jwt" { capabilities = ["read"] }
path "ft_transcendence/data/cookie" { capabilities = ["read"] }
path "ft_transcendence/data/internal_api" { capabilities = ["read"] }
path "ft_transcendence/data/redis" { capabilities = ["read"] }
path "ft_transcendence/data/config/urls" { capabilities = ["read"] }
path "ft_transcendence/data/config/ports" { capabilities = ["read"] }
path "ft_transcendence/data/email/brevo" { capabilities = ["read"] }
path "ft_transcendence/data/config/tls" { capabilities = ["read"] }
EOF

# WebSocket service policy
vault policy write websocket-policy - <<EOF
path "ft_transcendence/data/jwt" { capabilities = ["read"] }
path "ft_transcendence/data/cookie" { capabilities = ["read"] }
path "ft_transcendence/data/internal_api" { capabilities = ["read"] }
path "ft_transcendence/data/redis" { capabilities = ["read"] }
path "ft_transcendence/data/config/urls" { capabilities = ["read"] }
path "ft_transcendence/data/config/ports" { capabilities = ["read"] }
path "ft_transcendence/data/config/tls" { capabilities = ["read"] }
EOF

# API Gateway policy
vault policy write api-gateway-policy - <<EOF
path "ft_transcendence/data/jwt" { capabilities = ["read"] }
path "ft_transcendence/data/cookie" { capabilities = ["read"] }
path "ft_transcendence/data/internal_api" { capabilities = ["read"] }
path "ft_transcendence/data/api/gateway" { capabilities = ["read"] }
path "ft_transcendence/data/api/master" { capabilities = ["read"] }
path "ft_transcendence/data/redis" { capabilities = ["read"] }
path "ft_transcendence/data/config/urls" { capabilities = ["read"] }
path "ft_transcendence/data/config/ports" { capabilities = ["read"] }
path "ft_transcendence/data/config/tls" { capabilities = ["read"] }
EOF

# RAG service policy
vault policy write rag-policy - <<EOF
path "ft_transcendence/data/api/groq" { capabilities = ["read"] }
path "ft_transcendence/data/database/recipe" { capabilities = ["read"] }
EOF

success "All policies created successfully!"

# ============================================
# STEP 9: Create AppRole roles for each service
# ============================================
log "Step 9: Creating AppRole roles for each service..."

for service in auth user recipe chat notification websocket api-gateway rag; do
    vault write auth/approle/role/${service}-service \
    policies="${service}-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=24h
done
success "All AppRole roles created"

# ============================================
# STEP 10: Get RoleID and generate SecretID for each service
# ============================================
log "Step 10: Generating RoleID and SecretID for each service..."

mkdir -p $APPROLE_DIR

for service in auth user recipe chat notification websocket api-gateway rag; do
    log " Generating credentials for ${service}-service..."
    vault read -field=role_id auth/approle/role/${service}-service/role-id \
      > $APPROLE_DIR/${service}-role-id
    
    vault write -f -field=secret_id auth/approle/role/${service}-service/secret-id \
        > $APPROLE_DIR/${service}-secret-id
done

success "All RoleIDs and SecretIDs generated"

# ============================================
# STEP 11: Final verification
# ============================================
log "Step 11: Final verification of the cluster status..."

log " Checking cluster status..."
set +e
vault status -address=$VAULT_ADDR_1
vault status -address=$VAULT_ADDR_2
vault status -address=$VAULT_ADDR_3
set -e

log " Checking secrets accessibility..."
vault kv list ft_transcendence/database/ || warning "Could not list database secrets"
vault kv list ft_transcendence/api/ || warning "Could not list api secrets"
vault kv list ft_transcendence/email/ || warning "Could not list email secrets"
vault kv get ft_transcendence/jwt > /dev/null 2>&1 && echo " JWT secret: OK" || warning "JWT secret: FAILED"
vault kv get ft_transcendence/cookie > /dev/null 2>&1 && echo " Cookie secret: OK" || warning "Cookie secret: FAILED"
vault kv get ft_transcendence/internal_api > /dev/null 2>&1 && echo " Internal API secret: OK" || warning "Internal API secret: FAILED"

success "Vault cluster initialized and configured successfully!"
success "All services can now authenticate using AppRole and access their secrets securely."

exit 0
