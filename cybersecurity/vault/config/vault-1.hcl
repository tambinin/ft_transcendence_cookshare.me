storage "raft" {
    path = "/vault/data"
    node_id = "vault-1"
    # vault-1 is the bootstrap leader — no retry_join here.
    # vault-2 and vault-3 will join vault-1 via their own retry_join config.
}

listener "tcp" {
    address         = "0.0.0.0:8200"
    tls_disable     = 0
    tls_cert_file   = "/vault/tls/vault-cert.pem"
    tls_key_file    = "/vault/tls/vault-key.pem"
    tls_min_version = "tls12"
}

api_addr        = "https://vault-1:8200"
cluster_addr    = "https://vault-1:8201"
ui              = true
disable_mlock   = true
log_level       = "info"