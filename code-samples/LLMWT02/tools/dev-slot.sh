#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="myapp.localhost"
PROXY_PORT=8088
API_PORT_BASE=20000
FRONTEND_PORT_BASE=40000
STATE_ROOT="${MYAPP_STATE_DIR:-$HOME/.config/myapp}"
SLOT_STATE_ROOT="$STATE_ROOT/slots"
CADDY_STATE_DIR="$STATE_ROOT/caddy"
COMPOSE_FILE="$ROOT_DIR/docker-compose.infra.yml"

sanitize_slot_name() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

default_slot_name() {
  local branch
  branch="$(git -C "$ROOT_DIR" branch --show-current 2>/dev/null || true)"
  if [[ -n "$branch" ]]; then
    printf '%s\n' "$branch"
  else
    git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || basename "$ROOT_DIR"
  fi
}

slot_offset() {
  printf '%s' "$1" | cksum | awk '{ print $1 % 10000 }'
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

compose() {
  HOME="$HOME" docker compose -f "$COMPOSE_FILE" "$@"
}

seed_caddyfile() {
  mkdir -p "$CADDY_STATE_DIR" "$SLOT_STATE_ROOT"
  if [[ ! -f "$CADDY_STATE_DIR/Caddyfile" ]]; then
    cat > "$CADDY_STATE_DIR/Caddyfile" <<'EOF'
{
	auto_https off
}
EOF
  fi
}

regenerate_caddyfile() {
  local output temporary route
  seed_caddyfile
  output="$CADDY_STATE_DIR/Caddyfile"
  temporary="$output.tmp.$$"

  cat > "$temporary" <<'EOF'
{
	auto_https off
}
EOF

  for route in "$SLOT_STATE_ROOT"/*/Caddyfile; do
    [[ -f "$route" ]] || continue
    cat "$route" >> "$temporary"
  done

  mv "$temporary" "$output"
  if docker inspect -f '{{.State.Running}}' myapp-caddy 2>/dev/null | grep -q true; then
    docker exec myapp-caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null
  fi
}

wait_for_url() {
  local url="$1" label="$2" attempts="${3:-60}"
  for (( attempt = 1; attempt <= attempts; attempt++ )); do
    if curl --fail --silent --show-error "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "$label did not become ready: $url" >&2
  return 1
}

cmd_infra_up() {
  require_command docker
  require_command curl
  seed_caddyfile
  compose up -d
  echo "Waiting for the Cosmos DB emulator..."
  wait_for_url "http://localhost:8080/ready" "Cosmos DB emulator" 120
  echo "Shared infrastructure is ready."
  echo "  Cosmos:        https://localhost:8081"
  echo "  Data Explorer: http://localhost:1234"
  echo "  Caddy:         http://localhost:$PROXY_PORT"
}

cmd_infra_down() {
  require_command docker
  if find "$SLOT_STATE_ROOT" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | grep -q .; then
    echo "Stop active slots before stopping shared infrastructure:" >&2
    cmd_status >&2
    exit 1
  fi
  compose down
}

ensure_infra() {
  if ! docker inspect -f '{{.State.Running}}' myapp-caddy 2>/dev/null | grep -q true; then
    echo "Shared infrastructure is not running. Run '$0 infra-up' first." >&2
    exit 1
  fi
  if ! curl --fail --silent "http://localhost:8080/ready" >/dev/null 2>&1; then
    echo "The Cosmos DB emulator is not ready. Run '$0 infra-up' and try again." >&2
    exit 1
  fi
}

assert_ports_available() {
  local slot="$1" api_port="$2" frontend_port="$3" env_file existing_slot
  for env_file in "$SLOT_STATE_ROOT"/*/env; do
    [[ -f "$env_file" ]] || continue
    existing_slot="$(basename "$(dirname "$env_file")")"
    [[ "$existing_slot" == "$slot" ]] && continue
    if grep -Eq "^(API_PORT=$api_port|FRONTEND_PORT=$frontend_port)$" "$env_file"; then
      echo "Port hash collision with slot '$existing_slot'. Choose an explicit slot name." >&2
      exit 1
    fi
  done
}

cmd_up() {
  local slot offset api_port frontend_port slot_dir
  require_command docker
  require_command curl
  require_command dotnet
  require_command npm
  ensure_infra

  slot="$(sanitize_slot_name "${1:-$(default_slot_name)}")"
  if [[ -z "$slot" ]]; then
    echo "The slot name must contain at least one letter or number." >&2
    exit 2
  fi
  offset="$(slot_offset "$slot")"
  api_port=$((API_PORT_BASE + offset))
  frontend_port=$((FRONTEND_PORT_BASE + offset))
  slot_dir="$SLOT_STATE_ROOT/$slot"

  if [[ -f "$slot_dir/api.pid" ]] && kill -0 "$(cat "$slot_dir/api.pid")" 2>/dev/null; then
    echo "Slot '$slot' is already running."
    echo "  Frontend: http://$slot.$DOMAIN:$PROXY_PORT"
    echo "  API:      http://api-$slot.$DOMAIN:$PROXY_PORT"
    return
  fi

  rm -rf "$slot_dir"
  mkdir -p "$slot_dir"
  assert_ports_available "$slot" "$api_port" "$frontend_port"

  cat > "$slot_dir/env" <<EOF
SLOT=$slot
API_PORT=$api_port
FRONTEND_PORT=$frontend_port
DATABASE=myapp-$slot
EOF

  cat > "$slot_dir/Caddyfile" <<EOF

http://$slot.$DOMAIN:$PROXY_PORT {
	reverse_proxy host.docker.internal:$frontend_port
}

http://api-$slot.$DOMAIN:$PROXY_PORT {
	reverse_proxy host.docker.internal:$api_port
}
EOF

  cat > "$ROOT_DIR/frontend/.env.local" <<EOF
VITE_API_BASE=http://api-$slot.$DOMAIN:$PROXY_PORT
EOF

  if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
    echo "Installing frontend dependencies..."
    (cd "$ROOT_DIR/frontend" && npm install)
  fi

  (
    cd "$ROOT_DIR/api"
    nohup env \
      Cosmos__Endpoint="https://localhost:8081" \
      Cosmos__Database="myapp-$slot" \
      dotnet run --no-launch-profile --urls "http://0.0.0.0:$api_port" \
      > "$slot_dir/api.log" 2>&1 < /dev/null &
    echo $! > "$slot_dir/api.pid"
  )

  (
    cd "$ROOT_DIR/frontend"
    nohup ./node_modules/.bin/vite \
      --host 0.0.0.0 --port "$frontend_port" --strictPort \
      > "$slot_dir/frontend.log" 2>&1 < /dev/null &
    echo $! > "$slot_dir/frontend.pid"
  )

  regenerate_caddyfile

  if ! wait_for_url "http://api-$slot.$DOMAIN:$PROXY_PORT/api/health" "API" 60; then
    tail -n 20 "$slot_dir/api.log" >&2
    exit 1
  fi
  if ! wait_for_url "http://$slot.$DOMAIN:$PROXY_PORT" "Frontend" 30; then
    tail -n 20 "$slot_dir/frontend.log" >&2
    exit 1
  fi

  echo "Slot '$slot' is ready."
  echo "  Frontend: http://$slot.$DOMAIN:$PROXY_PORT"
  echo "  API:      http://api-$slot.$DOMAIN:$PROXY_PORT"
  echo "  Database: myapp-$slot"
  echo "  Logs:     $slot_dir"
}

cmd_down() {
  local slot slot_dir pid_file pid
  slot="$(sanitize_slot_name "${1:-$(default_slot_name)}")"
  slot_dir="$SLOT_STATE_ROOT/$slot"

  for pid_file in "$slot_dir/api.pid" "$slot_dir/frontend.pid"; do
    [[ -f "$pid_file" ]] || continue
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  rm -rf "$slot_dir"
  regenerate_caddyfile
  echo "Slot '$slot' stopped. Its Cosmos database was preserved."
}

cmd_status() {
  local slot_dir slot api_port frontend_port database found=false
  echo "Known slots:"
  for slot_dir in "$SLOT_STATE_ROOT"/*/; do
    [[ -f "$slot_dir/env" ]] || continue
    found=true
    slot="$(sed -n 's/^SLOT=//p' "$slot_dir/env")"
    api_port="$(sed -n 's/^API_PORT=//p' "$slot_dir/env")"
    frontend_port="$(sed -n 's/^FRONTEND_PORT=//p' "$slot_dir/env")"
    database="$(sed -n 's/^DATABASE=//p' "$slot_dir/env")"
    echo "  $slot -> http://$slot.$DOMAIN:$PROXY_PORT (frontend :$frontend_port, api :$api_port, db $database)"
  done
  if [[ "$found" == false ]]; then
    echo "  none"
  fi
}

case "${1:-}" in
  infra-up)   cmd_infra_up ;;
  infra-down) cmd_infra_down ;;
  up)         shift; cmd_up "${1:-}" ;;
  down)       shift; cmd_down "${1:-}" ;;
  status)     cmd_status ;;
  *)
    echo "Usage: $0 {infra-up|infra-down|up|down|status} [slot]" >&2
    exit 2
    ;;
esac