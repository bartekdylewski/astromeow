#!/usr/bin/env bash
# AstroMeow – licznik wejść
#   bash counter.sh install        sprawdź zależności, zbuduj grę, utwórz bazę
#   bash counter.sh run [-d|stop|status|logs]   to samo co: bash ../run.sh (run.sh leży w katalogu aplikacji)
#   bash counter.sh tunnel         serwer + cloudflared + adres i QR
#   bash counter.sh stats          podsumowanie z bazy
#   bash counter.sh export         CSV na stdout
#   bash counter.sh backup         kopia bazy do $BACKUP_DIR (domyślnie ~/astromeow-backup)
#   bash counter.sh reset          kopia + wyzerowanie licznika (przed pokazem!)
#   bash counter.sh test           test automatyczny (bez dotykania prawdziwej bazy)
# Zmienne: PORT=8085  DB=ścieżka  SRC=scena  TUNNEL_NAME=nazwa (stały tunel Cloudflare)
#          BACKUP_DIR=~/astromeow-backup (ten sam katalog co w run.sh)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
HERE=$PWD
GAME=$(dirname "$HERE")
PORT=${PORT:-8085}
DB=${DB:-$HERE/data/counter.db}
SRC=${SRC:-scena}
PY=${PYTHON:-python3}
BACKUP_DIR=${BACKUP_DIR:-$HOME/astromeow-backup}

say()  { printf '\033[1;35m▸ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
SP=""; CF=""; TMP=""; LOG=""
cleanup() {
  [[ -n "$SP" ]] && kill "$SP" 2>/dev/null
  [[ -n "$CF" ]] && kill "$CF" 2>/dev/null
  [[ -n "$LOG" ]] && rm -f "$LOG"
  [[ -n "$TMP" ]] && rm -rf "$TMP"
  return 0
}
srv()  { "$PY" "$HERE/server.py" "$@"; }
build(){ say "Buduję dist/astromeow.html"; "$PY" "$GAME/build.py"; }
serve_args() { echo serve --port "$PORT" --db "$DB" --root "$GAME/dist" --live "$HERE/live.html"; }

cmd_install() {
  command -v "$PY" >/dev/null || die "Brak $PY"
  "$PY" - <<'EOF' || die "Potrzebny Python 3.8+ z modułem sqlite3"
import sys, sqlite3
assert sys.version_info >= (3, 8)
EOF
  say "Python OK ($("$PY" -V 2>&1))"
  if command -v cloudflared >/dev/null; then say "cloudflared OK"
  else warn "Brak cloudflared (potrzebny tylko do 'tunnel'): https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"; fi
  command -v qrencode >/dev/null && say "qrencode OK (będzie QR w terminalu)" \
    || warn "Opcjonalnie: sudo apt install qrencode (QR w terminalu i PNG)"
  build
  mkdir -p "$HERE/data"
  srv stats --db "$DB" >/dev/null
  say "Baza gotowa: $DB"
  say "Dalej: bash counter.sh test   i   bash run.sh w katalogu aplikacji   (tunel odpal raz osobno)"
}

cmd_tunnel() {
  command -v cloudflared >/dev/null || die "Brak cloudflared – zobacz: bash counter.sh install"
  build
  local url=""
  LOG=$(mktemp)
  # shellcheck disable=SC2046
  "$PY" "$HERE/server.py" $(serve_args) &
  SP=$!
  trap cleanup EXIT INT TERM
  sleep 1
  kill -0 "$SP" 2>/dev/null || die "Serwer nie wystartował (port $PORT zajęty?)"

  if [[ -n "${TUNNEL_NAME:-}" ]]; then
    say "Stały tunel: $TUNNEL_NAME"
    cloudflared tunnel run "$TUNNEL_NAME" >"$LOG" 2>&1 &
    CF=$!
    say "Adres to ten przypisany do tunelu w Cloudflare (QR zostaje ten sam)."
  else
    cloudflared tunnel --url "http://127.0.0.1:$PORT" >"$LOG" 2>&1 &
    CF=$!
    say "Czekam na adres z Cloudflare…"
    for _ in $(seq 1 40); do
      url=$(grep -o 'https://[-a-z0-9]*\.trycloudflare\.com' "$LOG" | head -n1 || true)
      [[ -n "$url" ]] && break
      kill -0 "$CF" 2>/dev/null || { cat "$LOG"; die "cloudflared się zakończył"; }
      sleep 0.5
    done
    [[ -n "$url" ]] || { cat "$LOG"; die "Nie dostałem adresu z cloudflared"; }
    local full="$url/?src=$SRC"
    echo
    say "GRA:   $full"
    say "LIVE:  $url/live   (otwórz na drugim ekranie)"
    warn "Ten adres zmienia się przy każdym uruchomieniu – QR generuj PO starcie!"
    if command -v qrencode >/dev/null; then
      qrencode -o "$HERE/data/qr.png" -s 14 -m 2 "$full" && say "QR zapisany: $HERE/data/qr.png"
      qrencode -t ANSIUTF8 "$full"
    fi
    echo
  fi
  say "Ctrl+C kończy serwer i tunel. Statystyki: bash counter.sh stats"
  wait -n "$SP" "$CF"
}

cmd_backup() {
  mkdir -p "$BACKUP_DIR"
  srv backup --db "$DB" --out "$BACKUP_DIR/counter-$(date +%Y%m%d-%H%M%S).db"
}

cmd_reset() {
  read -r -p "Wyzerować licznik? (zrobię kopię) [t/N] " yn
  [[ "$yn" =~ ^[tTyY]$ ]] || { echo "Anulowano."; exit 0; }
  cmd_backup
  srv reset --db "$DB"
}

cmd_test() {
  command -v curl >/dev/null || die "Test wymaga curl"
  local port=18085 ok=1
  TMP=$(mktemp -d)
  mkdir -p "$TMP/root"; echo "<h1>ok</h1>" >"$TMP/root/astromeow.html"
  "$PY" "$HERE/server.py" serve --port "$port" --db "$TMP/t.db" --root "$TMP/root" --live "$HERE/live.html" &
  SP=$!
  trap cleanup EXIT
  for _ in $(seq 1 30); do curl -fs "http://127.0.0.1:$port/healthz" >/dev/null 2>&1 && break; sleep 0.2; done

  local base="http://127.0.0.1:$port" ua="Mozilla/5.0 (test)"
  hit() { curl -s -A "${3:-$ua}" -c "$TMP/$1" -b "$TMP/$1" -X POST "$base/api/hit?src=$2" >/dev/null; }
  field() { curl -s "$base/api/stats" | "$PY" -c "import sys,json; print(json.load(sys.stdin)['$1'])"; }
  check() { if [[ "$2" == "$3" ]]; then echo "  ✓ $1"; else echo "  ✗ $1 (jest $2, ma być $3)"; ok=0; fi; }

  hit jar1 test; hit jar1 test;  check "ta sama przeglądarka 2× → 1 unikalny" "$(field unique)" 1
  check "…ale 2 uruchomienia" "$(field hits)" 2
  hit jar2 test;                 check "druga przeglądarka → 2 unikalnych" "$(field unique)" 2
  hit jar3 test "Googlebot/2.1"; check "bot nie jest liczony" "$(field unique)" 2
  check "strona główna 200" "$(curl -s -o /dev/null -w '%{http_code}' "$base/")" 200
  check "/live 200" "$(curl -s -o /dev/null -w '%{http_code}' "$base/live")" 200
  check "path traversal blokowany" "$(curl -s --path-as-is -o /dev/null -w '%{http_code}' "$base/../server.py")" 404
  check "baza .db niedostępna" "$(curl -s -o /dev/null -w '%{http_code}' "$base/t.db")" 404
  [[ $ok == 1 ]] && say "WSZYSTKO OK" || die "Są błędy"
}

case "${1:-help}" in
  install) cmd_install ;;
  run)     shift; exec bash "$GAME/run.sh" "$@" ;;
  tunnel)  cmd_tunnel ;;
  stats)   srv stats --db "$DB" ;;
  export)  srv export --db "$DB" ;;
  backup)  cmd_backup ;;
  reset)   cmd_reset ;;
  test)    cmd_test ;;
  *)       sed -n '2,14p' "${BASH_SOURCE[0]}" ;;
esac
