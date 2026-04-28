{{- with secret "ft_transcendence/internal_api" }}
INTERNAL_API_KEY={{ .Data.data.internal_key }}
{{- end }}

{{- with secret "ft_transcendence/jwt" }}
JWT_SECRET={{ .Data.data.jwt_secret }}
{{- end }}

{{- with secret "ft_transcendence/cookie" }}
COOKIE_SECRET={{ .Data.data.cookie_secret }}
{{- end }}

{{- with secret "ft_transcendence/redis" }}
REDIS_HOST={{ .Data.data.host }}
REDIS_PORT={{ .Data.data.port }}
REDIS_PASSWORD={{ .Data.data.password }}
{{- end }}

{{- with secret "ft_transcendence/config/urls" }}
DOMAIN={{ .Data.data.domain }}
CORS_ORIGINS={{ .Data.data.cors_origins }}
RECIPE_SERVICE_URL={{ .Data.data.recipe }}
USER_SERVICE_URL={{ .Data.data.user }}
AUTH_SERVICE_URL={{ .Data.data.auth }}
CHAT_SERVICE_URL={{ .Data.data.chat }}
NOTIFICATION_SERVICE_URL={{ .Data.data.notification }}
{{- end }}

{{- with secret "ft_transcendence/config/ports" }}
WEBSOCKET_SERVICE_PORT={{ .Data.data.websocket }}
AUTH_SERVICE_PORT={{ .Data.data.auth }}
RECIPE_SERVICE_PORT={{ .Data.data.recipe }}
USER_SERVICE_PORT={{ .Data.data.user }}
CHAT_SERVICE_PORT={{ .Data.data.chat }}
NOTIFICATION_SERVICE_PORT={{ .Data.data.notification }}
{{- end }}

{{- with secret "ft_transcendence/config/tls" }}
TLS_KEY_PATH={{ .Data.data.key_path }}
TLS_CERT_PATH={{ .Data.data.cert_path }}
{{- end }}
