#!/bin/sh
# ============================================
# Generate self-signed TLS certificates for
# the Vault cluster (vault-1, vault-2, vault-3)
# ============================================
# Run this script ONCE before starting the cluster:
#   sh cybersecurity/vault/scripts/generate-tls.sh

set -e

CERTS_DIR="$(dirname "$0")/../tls"
mkdir -p "$CERTS_DIR"

echo "[+] Generating Vault TLS certificate (SAN: vault-1, vault-2, vault-3, localhost, 127.0.0.1)"

# Generate private key
openssl genrsa -out "$CERTS_DIR/vault-key.pem" 4096

# Build OpenSSL config with SANs for the 3 Vault nodes
cat > /tmp/vault-tls.cnf <<EOF
[req]
default_bits       = 4096
prompt             = no
default_md         = sha256
distinguished_name = dn
req_extensions     = v3_req
x509_extensions    = v3_req

[dn]
C  = FR
ST = France
L  = Paris
O  = ft_transcendence
CN = vault

[v3_req]
subjectAltName = @alt_names
keyUsage       = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = vault-1
DNS.2 = vault-2
DNS.3 = vault-3
DNS.4 = localhost
IP.1  = 127.0.0.1
EOF

# Generate self-signed certificate (valid 10 years)
openssl req -new -x509 \
    -key "$CERTS_DIR/vault-key.pem" \
    -out "$CERTS_DIR/vault-cert.pem" \
    -days 3650 \
    -config /tmp/vault-tls.cnf

chmod 644 "$CERTS_DIR/vault-cert.pem"
chmod 600 "$CERTS_DIR/vault-key.pem"

echo "[+] TLS certificates generated:"
echo "    $CERTS_DIR/vault-cert.pem  (certificate + CA)"
echo "    $CERTS_DIR/vault-key.pem   (private key)"
echo ""
openssl x509 -in "$CERTS_DIR/vault-cert.pem" -noout -subject -dates -ext subjectAltName
