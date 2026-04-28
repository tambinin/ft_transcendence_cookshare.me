{{- with secret "ft_transcendence/api/groq" }}
GROQ_API_KEY={{ .Data.data.groq_api_key }}
{{- end }}

{{- with secret "ft_transcendence/database/recipe" }}
RECIPE_DATABASE_URL='{{ .Data.data.recipe_url }}'
{{- end }}

