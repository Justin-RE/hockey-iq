#!/bin/bash
# beforeReadFile: deny agent reads of .env files and private keys (.env.example is allowed).
input=$(cat)
file=$(printf '%s' "$input" | /usr/bin/python3 -c 'import sys,json; print(json.load(sys.stdin).get("file_path",""))' 2>/dev/null)
name=$(basename "$file")

if [[ "$name" =~ ^\.env(\..+)?$ && "$name" != ".env.example" ]] || [[ "$name" =~ \.(pem|key)$ ]]; then
  echo '{"permission":"deny","user_message":"Blocked agent read of a secrets file.","agent_message":"Reading .env files and private keys is blocked by project policy. Use .env.example or ask the user for non-secret values."}'
  exit 0
fi

echo '{"permission":"allow"}'
