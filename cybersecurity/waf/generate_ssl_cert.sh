#!/bin/bash

CERT_DIR="cybersecurity/waf/certs"
CERT_NAME="waf-ssl"
KEY_FILE="$CERT_DIR/key.pem"
CERT_FILE="$CERT_DIR/cert.pem"

# Accept optional extra IP/domain from Makefile (e.g. the machine's local IP)
EXTRA_SAN_IP="${1:-}"

if [ ! -d $CERT_DIR ]; then
    mkdir -p "$CERT_DIR"
fi

if [ ! -f "$KEY_FILE" ]; then

    echo "Generating SSL certificate in $CERT_DIR..."

    openssl genpkey -algorithm RSA -out "$KEY_FILE" -pkeyopt rsa_keygen_bits:2048
fi

# Regenerate cert if an extra SAN IP was requested, or if cert doesn't exist yet
NEED_REGEN=false
if [ ! -f "$CERT_FILE" ]; then
    NEED_REGEN=true
elif [ -n "$EXTRA_SAN_IP" ]; then
    # Check if the current cert already contains this IP
    if ! openssl x509 -in "$CERT_FILE" -noout -text 2>/dev/null | grep -q "$EXTRA_SAN_IP"; then
        echo "Certificate doesn't contain IP $EXTRA_SAN_IP, regenerating..."
        NEED_REGEN=true
    fi
fi

if [ "$NEED_REGEN" = true ]; then
    # Build SAN entries dynamically
    SAN_BLOCK="DNS.1 = cookshare.me
DNS.2 = www.cookshare.me
DNS.3 = localhost
IP.1 = 127.0.0.1"

    IP_INDEX=2
    if [ -n "$EXTRA_SAN_IP" ]; then
        SAN_BLOCK="$SAN_BLOCK
IP.$IP_INDEX = $EXTRA_SAN_IP"
    fi

    cat > "$CERT_DIR/waf-openssl.cnf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = MG
ST = Antananarivo
L = Antananarivo
O = FT_Transcendence
OU = WAF
CN = cookshare.me

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
$SAN_BLOCK
EOF

    openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 -config "$CERT_DIR/waf-openssl.cnf"

    rm -f "$CERT_DIR/waf-openssl.cnf"

    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"

    if [ -n "$EXTRA_SAN_IP" ]; then
        echo "SSL certificate generated for cookshare.me, localhost, and $EXTRA_SAN_IP"
    else
        echo "SSL certificate generated for cookshare.me and localhost"
    fi
fi
