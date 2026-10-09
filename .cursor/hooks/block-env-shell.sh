#!/bin/bash
# beforeShellExecution: deny shell commands that touch .env files (mentions of .env.example alone are allowed).
input=$(cat)
cmd=$(printf '%s' "$input" | /usr/bin/python3 -c 'import sys,json; print(json.load(sys.stdin).get("command",""))' 2>/dev/null)
stripped=${cmd//.env.example/}

if printf '%s' "$stripped" | /usr/bin/grep -Eq '(^|[[:space:]/"'"'"'=<>])\.env(\.[A-Za-z0-9_-]+)?([[:space:]"'"'"';|&)]|$)'; then
  echo '{"permission":"deny","user_message":"Blocked an agent shell command that touches a .env file.","agent_message":"Shell access to .env files is blocked by project policy. Pass non-secret values inline as environment variables, or ask the user to edit .env."}'
  exit 0
fi

echo '{"permission":"allow"}'
