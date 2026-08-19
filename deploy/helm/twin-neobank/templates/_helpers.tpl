{{/* Common labels applied to every resource. */}}
{{- define "twin-neobank.labels" -}}
app.kubernetes.io/part-of: twin-neobank
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}
