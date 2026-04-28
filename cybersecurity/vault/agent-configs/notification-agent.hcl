vault {
    address = "https://vault-1:8200"
    ca_cert = "/vault/tls/vault-cert.pem"
}

auto_auth {
    method {
        type = "approle"
        config {
            role_id_file_path = "/vault/approle/notification-role-id"
            secret_id_file_path = "/vault/approle/notification-secret-id"
            remove_secret_id_file_after_reading = false
        }
    }

    sink {
        type = "file"
        config = {
            path = "/vault/agent-token"
        }
    }
}

template {
    source      = "/vault/templates/notification.env.tpl"
    destination = "/vault/secrets/notification.env"
}