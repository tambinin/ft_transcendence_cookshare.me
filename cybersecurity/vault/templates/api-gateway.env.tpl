{{- with secret "ft_transcendence/internal_api" }}
INTERNAL_API_KEY={{ .Data.data.internal_key }}
{{- end }}

{{- with secret "ft_transcendence/jwt" }}
JWT_SECRET={{ .Data.data.jwt_secret }}
{{- end }}

{{- with secret "ft_transcendence/cookie" }}
COOKIE_SECRET={{ .Data.data.cookie_secret }}
{{- end }}

{{- with secret "ft_transcendence/api/gateway" }}
API_GATEWAY_KEY={{ .Data.data.gateway_key }}
{{- end }}

{{- with secret "ft_transcendence/api/master" }}
API_MASTER_SECRET={{ .Data.data.master_secret }}
{{- end }}

{{- with secret "ft_transcendence/redis" }}
REDIS_HOST={{ .Data.data.host }}
REDIS_PORT={{ .Data.data.port }}
REDIS_PASSWORD={{ .Data.data.password }}
{{- end }}

{{- with secret "ft_transcendence/config/urls" }}
DOMAIN={{ .Data.data.domain }}
CORS_ORIGINS={{ .Data.data.cors_origins }}
SERVER_URL={{ .Data.data.server_url }}
API_GATEWAY_URL={{ .Data.data.api_gateway }}
RECIPE_SERVICE_URL={{ .Data.data.recipe }}
AUTH_SERVICE_URL={{ .Data.data.auth }}
USER_SERVICE_URL={{ .Data.data.user }}
CHAT_SERVICE_URL={{ .Data.data.chat }}
NOTIFICATION_SERVICE_URL={{ .Data.data.notification }}
PUBLIC_URL={{ .Data.data.server_url }}
WEBSOCKET_SERVICE_URL={{ .Data.data.websocket }}
{{- end }}

{{- with secret "ft_transcendence/config/ports" }}
API_GATEWAY_PORT={{ .Data.data.api_gateway }}
RECIPE_SERVICE_PORT={{ .Data.data.recipe }}
AUTH_SERVICE_PORT={{ .Data.data.auth }}
USER_SERVICE_PORT={{ .Data.data.user }}
CHAT_SERVICE_PORT={{ .Data.data.chat }}
NOTIFICATION_SERVICE_PORT={{ .Data.data.notification }}
WEBSOCKET_SERVICE_PORT={{ .Data.data.websocket }}
{{- end }}

{{- with secret "ft_transcendence/config/tls" }}
TLS_KEY_PATH={{ .Data.data.key_path }}
TLS_CERT_PATH={{ .Data.data.cert_path }}
{{- end }}
