storage "raft" {
    path = "/vault/data"
    node_id = "vault-3"

    retry_join {
        leader_api_addr = "https://vault-1:8200"
        leader_tls_servername = "vault-1"
        leader_ca_cert_file = "/vault/tls/vault-cert.pem"
    }
    retry_join {
        leader_api_addr = "https://vault-2:8200"
        leader_tls_servername = "vault-2"
        leader_ca_cert_file = "/vault/tls/vault-cert.pem"
    }
}

listener "tcp" {
    address         = "0.0.0.0:8200"
    tls_disable     = 0
    tls_cert_file   = "/vault/tls/vault-cert.pem"
    tls_key_file    = "/vault/tls/vault-key.pem"
    tls_min_version = "tls12"
}

api_addr        = "https://vault-3:8200"
cluster_addr    = "https://vault-3:8201"
ui              = true
disable_mlock   = true
log_level       = "info"