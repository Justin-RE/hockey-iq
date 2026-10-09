#!/bin/bash
# afterFileEdit: format the edited file with the repo's Prettier. Never blocks.
input=$(cat)
file=$(printf '%s' "$input" | /usr/bin/python3 -c 'import sys,json; print(json.load(sys.stdin).get("file_path",""))' 2>/dev/null)

for dir in "$HOME"/.nvm/versions/node/*/bin /opt/homebrew/bin /usr/local/bin; do
  [[ -d "$dir" ]] && PATH="$dir:$PATH"
done
export PATH

case "$file" in
  *.ts|*.tsx|*.js|*.mjs|*.cjs|*.json|*.css|*.md|*.yml|*.yaml)
    [[ -x node_modules/.bin/prettier ]] && node_modules/.bin/prettier --write --ignore-unknown --log-level silent "$file" >/dev/null 2>&1
    ;;
esac

echo '{}'
exit 0
