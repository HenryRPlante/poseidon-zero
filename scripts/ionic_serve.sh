#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NVMRC_FILE="$PROJECT_ROOT/.nvmrc"

if [[ ! -f "$NVMRC_FILE" ]]; then
  echo "Missing .nvmrc at $NVMRC_FILE"
  exit 1
fi

REQUIRED_NODE="$(tr -d '[:space:]' < "$NVMRC_FILE")"

version_lt() {
  [[ "$1" == "$2" ]] && return 1
  local first
  first="$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)"
  [[ "$first" == "$1" ]]
}

CURRENT_NODE="$(node -p "process.versions.node" 2>/dev/null || echo "")"

if [[ -z "$CURRENT_NODE" ]] || version_lt "$CURRENT_NODE" "$REQUIRED_NODE"; then
  unset npm_config_prefix || true
  unset NPM_CONFIG_PREFIX || true
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh" --no-use
    nvm install "$REQUIRED_NODE" >/dev/null
    nvm use "$REQUIRED_NODE" >/dev/null
  elif [[ -x "$HOME/.nvm/versions/node/v$REQUIRED_NODE/bin/node" ]]; then
    export PATH="$HOME/.nvm/versions/node/v$REQUIRED_NODE/bin:$PATH"
  else
    echo "Node $REQUIRED_NODE+ is required. Install nvm or Node $REQUIRED_NODE and retry."
    exit 1
  fi
fi

cd "$PROJECT_ROOT"
exec ionic serve "$@"
