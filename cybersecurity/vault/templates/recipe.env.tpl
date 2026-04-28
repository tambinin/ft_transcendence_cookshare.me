{{- with secret "ft_transcendence/internal_api" }}
INTERNAL_API_KEY={{ .Data.data.internal_key }}
{{- end }}

{{- with secret "ft_transcendence/jwt" }}
JWT_SECRET={{ .Data.data.jwt_secret }}
{{- end }}

{{- with secret "ft_transcendence/cookie" }}
COOKIE_SECRET={{ .Data.data.cookie_secret }}
{{- end }}

{{- with secret "ft_transcendence/database/recipe" }}
RECIPE_DATABASE_URL='{{ .Data.data.recipe_url }}'
{{- end }}

{{- with secret "ft_transcendence/redis" }}
REDIS_HOST={{ .Data.data.host }}
REDIS_PORT={{ .Data.data.port }}
REDIS_PASSWORD={{ .Data.data.password }}
{{- end }}

{{- with secret "ft_transcendence/cloudinary" }}
CLOUDINARY_CLOUD_NAME={{ .Data.data.cloud_name }}
CLOUDINARY_API_KEY={{ .Data.data.api_key }}
CLOUDINARY_API_SECRET={{ .Data.data.api_secret }}
CLOUDINARY_URL={{ .Data.data.url }}
{{- end }}

{{- with secret "ft_transcendence/config/urls" }}
DOMAIN={{ .Data.data.domain }}
USER_SERVICE_URL={{ .Data.data.user }}
NOTIFICATION_SERVICE_URL={{ .Data.data.notification }}
WEBSOCKET_SERVICE_URL={{ .Data.data.websocket }}
{{- end }}

{{- with secret "ft_transcendence/config/ports" }}
RECIPE_SERVICE_PORT={{ .Data.data.recipe }}
NOTIFICATION_SERVICE_PORT={{ .Data.data.notification }}
WEBSOCKET_SERVICE_PORT={{ .Data.data.websocket }}
USER_SERVICE_PORT={{ .Data.data.user }}
{{- end }}

{{- with secret "ft_transcendence/config/tls" }}
TLS_KEY_PATH={{ .Data.data.key_path }}
TLS_CERT_PATH={{ .Data.data.cert_path }}
{{- end }}
