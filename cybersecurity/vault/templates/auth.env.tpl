{{- with secret "ft_transcendence/internal_api" }}
INTERNAL_API_KEY={{ .Data.data.internal_key }}
{{- end }}

{{- with secret "ft_transcendence/jwt" }}
JWT_SECRET={{ .Data.data.jwt_secret }}
{{- end }}

{{- with secret "ft_transcendence/cookie" }}
COOKIE_SECRET={{ .Data.data.cookie_secret }}
{{- end }}

{{- with secret "ft_transcendence/database/auth" }}
AUTH_DATABASE_URL='{{ .Data.data.auth_url }}'
{{- end }}

{{- with secret "ft_transcendence/redis" }}
REDIS_HOST={{ .Data.data.host }}
REDIS_PORT={{ .Data.data.port }}
REDIS_PASSWORD={{ .Data.data.password }}
{{- end }}

{{- with secret "ft_transcendence/config/urls" }}
DOMAIN={{ .Data.data.domain }}
USER_SERVICE_URL={{ .Data.data.user }}
NOTIFICATION_SERVICE_URL={{ .Data.data.notification }}
{{- end }}

{{- with secret "ft_transcendence/config/ports" }}
AUTH_SERVICE_PORT={{ .Data.data.auth }}
{{- end }}

{{- with secret "ft_transcendence/config/tls" }}
TLS_KEY_PATH={{ .Data.data.key_path }}
TLS_CERT_PATH={{ .Data.data.cert_path }}
{{- end }}

{{- with secret "ft_transcendence/google_oauth" }}
GOOGLE_CLIENT_ID={{ .Data.data.client_id }}
GOOGLE_CLIENT_SECRET={{ .Data.data.client_secret }}
{{- end }}
