#!/usr/bin/env bash
# AstroMeow – zbuduj i (prze)uruchom aplikację pod STAŁYM portem. Tunel odpalasz sam, raz.
#
#   bash run.sh          build + (re)start w tym terminalu (Ctrl+C kończy); jak serwer padnie, sam wstaje
#   bash run.sh -d       to samo w tle (logi: data/server.log)
#   bash run.sh stop     zatrzymaj
#   bash run.sh status   czy działa + statystyki
#   bash run.sh logs     śledź logi (tryb -d)
#
# Tunel (raz, w osobnym terminalu/tmux, nie zamykaj):  cloudflared tunnel --url http://127.0.0.1:8085
# Baza = zwykły plik SQLite counter/data/counter.db. Zostaje między restartami; przy każdym starcie robię jej kopię.
# Zmienne: PORT=8085 (ten sam co w tunelu!)  DB=ścieżka  PYTHON=python3  KEEP=10 (ile kopii trzymać)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
GAME=$PWD            # katalog aplikacji (tu leży build.py)
CNT=$GAME/counter    # licznik: server.py, live.html, data/
PORT=${PORT:-8085}
PY=${PYTHON:-python3}
DATA=$CNT/data
DB=${DB:-$DATA/counter.db}
PIDF=$DATA/server.pid
LOGF=$DATA/server.log
KEEP=${KEEP:-10}
mkdir -p "$DATA/backups"

say()  { printf '\033[1;35m▸ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
srv()  { "$PY" "$CNT/server.py" "$@"; }

healthy() {
  "$PY" - "$PORT" <<'EOF' 2>/dev/null
import sys, urllib.request
urllib.request.urlopen("http://127.0.0.1:%s/healthz" % sys.argv[1], timeout=1).read()
EOF
}

is_supervisor() {  # czy PID to nasz run.sh
  local p=${1:-}
  [[ -n $p ]] && ps -p "$p" -o args= 2>/dev/null | grep -q 'run.sh'
}

stop() {
  local p; p=$(cat "$PIDF" 2>/dev/null || true)
  if [[ -n $p ]] && is_supervisor "$p"; then
    kill -TERM "$p" 2>/dev/null || true
    for _ in $(seq 1 50); do kill -0 "$p" 2>/dev/null || break; sleep 0.1; done
    if kill -0 "$p" 2>/dev/null; then kill -9 "$p" 2>/dev/null || true; fi
  fi
  # osierocony serwer (np. po twardym ubiciu run.sh)
  pkill -f "server.py serve --port $PORT" 2>/dev/null || true
  for _ in $(seq 1 30); do pgrep -f "server.py serve --port $PORT" >/dev/null 2>&1 || break; sleep 0.1; done
  rm -f "$PIDF"
}

build() {
  say "Buduję dist/astromeow.html"
  "$PY" "$GAME/build.py"
}

backup_db() {
  [[ -s $DB ]] || return 0
  local out="$DATA/backups/counter-$(date +%Y%m%d-%H%M%S).db"
  srv backup --db "$DB" --out "$out" >/dev/null
  # zostaw tylko KEEP ostatnich kopii
  ls -1t "$DATA"/backups/counter-*.db 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f
  say "Kopia bazy: ${out#"$GAME"/}"
}

# ----- nadzorca: trzyma serwer przy życiu (to jest proces z pidfile) -----
CHILD=""; STOP=0
supervise() {
  echo $$ >"$PIDF"
  trap 'STOP=1; [[ -n $CHILD ]] && kill -TERM "$CHILD" 2>/dev/null; true' INT TERM
  trap 'rm -f "$PIDF"' EXIT
  local fails=0 t0
  while :; do
    t0=$SECONDS
    "$PY" "$CNT/server.py" serve --port "$PORT" --db "$DB" --root "$GAME/dist" --live "$CNT/live.html" &
    CHILD=$!
    wait "$CHILD" || true
    [[ $STOP == 1 ]] && break
    if (( SECONDS - t0 < 3 )); then fails=$((fails + 1)); else fails=0; fi
    (( fails >= 5 )) && die "Serwer pada zaraz po starcie 5× z rzędu (port $PORT zajęty? zobacz logi) – poddaję się"
    warn "Serwer padł – restart za 1 s"
    sleep 1
  done
  wait "$CHILD" 2>/dev/null || true   # daj mu dokończyć zamykanie bazy
  say "Serwer zatrzymany."
}

cmd_start() {
  local daemon=${1:-0}
  build                                   # jeśli build się wywali, stara instancja NIE jest ruszana
  stop                                    # zatrzymaj poprzednią (ten sam port)
  backup_db
  if [[ -s $DB ]]; then say "Baza istnieje – dane z poprzednich uruchomień zostają:"; srv stats --db "$DB" | sed -n '1,2p'; else say "Nowa baza: $DB"; fi
  say "Tunel (jeśli jeszcze nie działa, w osobnym terminalu):  cloudflared tunnel --url http://127.0.0.1:$PORT"
  if [[ $daemon == 1 ]]; then
    nohup setsid bash "$GAME/run.sh" __supervise >>"$LOGF" 2>&1 < /dev/null &
    for _ in $(seq 1 50); do healthy && break; sleep 0.2; done
    if healthy; then
      say "Działa w tle: http://127.0.0.1:$PORT   (live: /live)   logi: bash run.sh logs   stop: bash run.sh stop"
    else
      tail -n 20 "$LOGF" || true
      die "Serwer nie odpowiada na porcie $PORT"
    fi
  else
    supervise
  fi
}

cmd_status() {
  local p; p=$(cat "$PIDF" 2>/dev/null || true)
  if [[ -n $p ]] && is_supervisor "$p" && healthy; then
    say "DZIAŁA (pid $p, port $PORT)"; srv stats --db "$DB"
  else
    warn "NIE DZIAŁA na porcie $PORT"; exit 1
  fi
}

case "${1:-start}" in
  start|"")      cmd_start 0 ;;
  -d|--daemon)   cmd_start 1 ;;
  __supervise)   supervise ;;
  stop)          stop; say "Zatrzymano." ;;
  status)        cmd_status ;;
  logs)          exec tail -n 50 -f "$LOGF" ;;
  *)             sed -n '2,13p' "${BASH_SOURCE[0]}" ;;
esac
