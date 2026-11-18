#!/usr/bin/env python3
"""AstroMeow – serwer gry + licznik unikalnych wejść (SQLite, tylko biblioteka standardowa).

  python3 server.py serve   [--port 8085] [--db data/counter.db] [--root ../dist] [--live live.html]
  python3 server.py stats   [--db ...]
  python3 server.py export  [--db ...]            # CSV na stdout
  python3 server.py backup  [--db ...] --out plik.db
  python3 server.py reset   [--db ...]

Unikalność = cookie `vid` (losowe UUID). Wejście liczy się, gdy gra wyśle POST /api/hit.
"""
import argparse, csv, hashlib, json, mimetypes, os, posixpath, re, signal, sqlite3, sys, threading, time, uuid
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

import nasa
import players

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = """
CREATE TABLE IF NOT EXISTS visits (
  id         TEXT    PRIMARY KEY,           -- wartość cookie vid
  first_seen INTEGER NOT NULL,              -- unix time pierwszego wejścia
  last_seen  INTEGER NOT NULL,              -- unix time ostatniego wejścia
  hits       INTEGER NOT NULL DEFAULT 1,    -- ile razy odpalono grę
  src        TEXT    NOT NULL DEFAULT ''    -- ?src=... z QR (scena, plakat...)
);
CREATE INDEX IF NOT EXISTS idx_visits_last  ON visits(last_seen);
CREATE INDEX IF NOT EXISTS idx_visits_first ON visits(first_seen);
"""
VID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
SRC_RE = re.compile(r"[^a-zA-Z0-9_-]")
BOT_RE = re.compile(r"bot|crawler|spider|preview|facebookexternalhit|slurp|whatsapp|telegram|headless", re.I)


def connect(path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False, timeout=10)
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.executescript(SCHEMA + players.SCHEMA)
    return conn


def record(conn, lock, vid, src):
    now = int(time.time())
    with lock, conn:
        conn.execute(
            "INSERT INTO visits(id, first_seen, last_seen, src) VALUES (?,?,?,?) "
            "ON CONFLICT(id) DO UPDATE SET hits = hits + 1, last_seen = excluded.last_seen",
            (vid, now, now, src),
        )


def get_stats(conn, lock):
    now = int(time.time())
    with lock:
        unique, hits = conn.execute("SELECT COUNT(*), COALESCE(SUM(hits),0) FROM visits").fetchone()
        active5 = conn.execute("SELECT COUNT(*) FROM visits WHERE last_seen >= ?", (now - 300,)).fetchone()[0]
        new1 = conn.execute("SELECT COUNT(*) FROM visits WHERE first_seen >= ?", (now - 60,)).fetchone()[0]
        active60 = conn.execute("SELECT COUNT(*) FROM visits WHERE last_seen >= ?", (now - 3600,)).fetchone()[0]
        new60 = conn.execute("SELECT COUNT(*) FROM visits WHERE first_seen >= ?", (now - 3600,)).fetchone()[0]
        active24 = conn.execute("SELECT COUNT(*) FROM visits WHERE last_seen >= ?", (now - 86400,)).fetchone()[0]
        new24 = conn.execute("SELECT COUNT(*) FROM visits WHERE first_seen >= ?", (now - 86400,)).fetchone()[0]
        by_src = conn.execute("SELECT src, COUNT(*) FROM visits GROUP BY src ORDER BY 2 DESC").fetchall()
    return {
        "unique": unique, "hits": hits, "active5": active5, "new1": new1,
        "active60": active60, "new60": new60, "active24": active24, "new24": new24,
        "by_src": {(s or "(brak)"): n for s, n in by_src}, "ts": now,
    }


def get_timeline(conn, lock, hours=168):
    """Godzinowe kubełki: nowi gracze (visits.first_seen) i uruchomione gry (runs.started)."""
    now = int(time.time())
    hours = max(1, min(int(hours), 24 * 60))
    end = now - now % 3600 + 3600           # koniec bieżącej godziny
    start = end - hours * 3600
    with lock:
        before = conn.execute("SELECT COUNT(*) FROM visits WHERE first_seen < ?", (start,)).fetchone()[0]
        new = dict(conn.execute("SELECT first_seen/3600*3600, COUNT(*) FROM visits WHERE first_seen >= ? GROUP BY 1", (start,)).fetchall())
        runs = dict(conn.execute("SELECT CAST(started AS INTEGER)/3600*3600, COUNT(*) FROM runs WHERE started >= ? GROUP BY 1", (start,)).fetchall())
        games = conn.execute("SELECT game, COUNT(*) FROM runs GROUP BY game ORDER BY 2 DESC").fetchall()
    points, total = [], before
    for t in range(start, end, 3600):
        total += new.get(t, 0)
        points.append({"t": t, "new": new.get(t, 0), "total": total, "runs": runs.get(t, 0)})
    return {"points": points, "games": {g: n for g, n in games}, "ts": now}


class Handler(BaseHTTPRequestHandler):
    server_version = "AstroMeow"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        if self.server.verbose:
            sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))

    # ---------- pomocnicze ----------
    def _send(self, status, body=b"", ctype="text/plain; charset=utf-8", headers=None, head=False):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if not head:
            self.wfile.write(body)

    def _json(self, obj, status=200, headers=None, head=False):
        self._send(status, json.dumps(obj).encode(), "application/json", headers, head)

    def _dev_player(self):
        """Czy cookie sesji należy do gracza z listy --dev-nick (np. "dylu" albo "dylu#8054")."""
        nicks = self.server.dev_nicks
        jar = SimpleCookie(self.headers.get("Cookie", ""))
        if not nicks or "astro_session" not in jar:
            return False
        token_hash = hashlib.sha256(jar["astro_session"].value.encode()).hexdigest()
        with self.server.lock:
            row = self.server.conn.execute("SELECT name_key, tag FROM players WHERE token=?", (token_hash,)).fetchone()
        return bool(row and row[0] and (row[0] in nicks or ("%s#%04d" % (row[0], row[1] or 0)) in nicks))

    def _file(self, full, head=False):
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        with open(full, "rb") as f:
            body = f.read()
        if ctype.startswith("text/html") and (self.server.dev or self._dev_player()):   # ?dev= i ?demo=1: tylko z --dev albo dla kont z --dev-nick
            body = body.replace(b"<head>", b"<head><script>window.ALLOW_DEV=1</script>", 1)
        self._send(200, body, ctype, head=head)

    def _static(self, path, head=False):
        root = self.server.root
        rel = posixpath.normpath(unquote(path)).lstrip("/")
        if rel in ("", "."):
            rel = "astromeow.html"
        full = os.path.realpath(os.path.join(root, rel))
        if not (full == root or full.startswith(root + os.sep)) or not os.path.isfile(full):
            return self._send(404, b"404", head=head)
        self._file(full, head)

    # ---------- GET / HEAD ----------
    def _get(self, head):
        path = urlparse(self.path).path
        if path == "/api/nasa":
            return self._json(self.server.nasa.get(), head=head)
        if path == "/api/stats":
            return self._json(get_stats(self.server.conn, self.server.lock), head=head)
        if path == "/api/timeline":
            q = parse_qs(urlparse(self.path).query)
            try:
                hours = int(q.get("hours", ["168"])[0])
            except ValueError:
                hours = 168
            return self._json(get_timeline(self.server.conn, self.server.lock, hours), head=head)
        if path in ("/live", "/live.html"):
            if os.path.isfile(self.server.live):
                return self._file(self.server.live, head)
            return self._send(404, b"404", head=head)
        if path == "/healthz":
            return self._send(200, b"ok", head=head)
        self._static(path, head)

    def do_GET(self):
        self._get(False)

    def do_HEAD(self):
        self._get(True)

    # ---------- POST /api/hit ----------
    def do_POST(self):
        parsed = urlparse(self.path)
        routes = {
            "/api/session": "session", "/api/profile": "profile",
            "/api/run/start": "run/start", "/api/run/finish": "run/finish",
            "/api/leaderboard": "leaderboard",
        }
        if parsed.path in routes:
            return self._player_request(routes[parsed.path])
        length = int(self.headers.get("Content-Length") or 0)
        if length:
            self.rfile.read(min(length, 65536))
        if parsed.path != "/api/hit":
            return self._send(404, b"404")
        if BOT_RE.search(self.headers.get("User-Agent", "")):
            return self._json({"ok": True, "counted": False})

        jar = SimpleCookie(self.headers.get("Cookie", ""))
        vid = jar["vid"].value if "vid" in jar else ""
        is_new = not VID_RE.match(vid)
        if is_new:
            vid = str(uuid.uuid4())
        src = SRC_RE.sub("", parse_qs(parsed.query).get("src", [""])[0])[:32]
        record(self.server.conn, self.server.lock, vid, src)

        headers = {}
        if is_new:
            https = (self.headers.get("X-Forwarded-Proto", "") == "https"
                     or '"https"' in self.headers.get("CF-Visitor", ""))
            headers["Set-Cookie"] = ("vid=%s; Max-Age=31536000; Path=/; SameSite=Lax; HttpOnly%s"
                                     % (vid, "; Secure" if https else ""))
        self._json({"ok": True, "counted": True, "new": is_new}, headers=headers)


    def _player_request(self, route):
        if self.headers.get_content_type() != "application/json":
            self.close_connection = True
            return self._json({"error": "Wymagany JSON."}, 415)
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 4096:
                self.close_connection = True
                return self._json({"error": "Nieprawidłowy rozmiar żądania."}, 400)
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError()
        except (ValueError, UnicodeError):
            return self._json({"error": "Nieprawidłowy JSON."}, 400)
        jar = SimpleCookie(self.headers.get("Cookie", ""))
        token = jar["astro_session"].value if "astro_session" in jar else ""
        try:
            with self.server.lock, self.server.conn:
                if token and route == "run/finish":
                    minute = int(time.monotonic() / 60)
                    if minute != self.server.score_rate_minute:
                        self.server.score_rate_minute = minute
                        self.server.score_requests.clear()
                    count = self.server.score_requests.get(token, 0)
                    if count >= 30:
                        raise players.ApiError(429, "Za dużo zgłoszeń wyniku. Spróbuj za chwilę.")
                    self.server.score_requests[token] = count + 1
                result, token = players.player_api(self.server.conn, route, data, token)
        except players.ApiError as exc:
            return self._json({"error": exc.message}, exc.status)
        headers = {}
        if token:
            secure = self.headers.get("X-Forwarded-Proto") == "https"
            headers["Set-Cookie"] = ("astro_session=%s; Max-Age=31536000; Path=/; SameSite=Lax; HttpOnly%s"
                                     % (token, "; Secure" if secure else ""))
        return self._json(result, headers=headers)


# ---------- komendy ----------
def cmd_serve(a):
    srv = ThreadingHTTPServer((a.host, a.port), Handler)
    srv.daemon_threads = True
    srv.conn = connect(a.db)
    srv.lock = threading.Lock()
    srv.score_rate_minute = None
    srv.score_requests = {}
    srv.root = os.path.realpath(a.root)
    srv.live = os.path.abspath(a.live)
    srv.verbose = a.verbose
    srv.dev = a.dev
    srv.nasa = nasa.Cache(a.nasa_key, os.path.join(os.path.dirname(os.path.abspath(a.db)), "nasa-cache.json"))
    srv.nasa.start(a.nasa_every)
    srv.dev_nicks = {n.lower() for n in a.dev_nick}
    if not os.path.isfile(os.path.join(srv.root, "astromeow.html")):
        sys.exit("Brak %s/astromeow.html – uruchom najpierw: python3 build.py" % srv.root)
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))  # stop z run.sh
    print("AstroMeow: http://%s:%d   (live: /live, baza: %s)" % (a.host, a.port, os.path.abspath(a.db)), flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
        srv.conn.close()


def cmd_stats(a):
    s = get_stats(connect(a.db), threading.Lock())
    print("Unikalni:            %d" % s["unique"])
    print("Wszystkie wejścia:   %d" % s["hits"])
    print("Aktywni (5 min):     %d" % s["active5"])
    print("Nowi (ostatnia min): %d" % s["new1"])
    print("Aktywni (1 h):       %d" % s["active60"])
    print("Nowi (1 h):          %d" % s["new60"])
    for src, n in s["by_src"].items():
        print("  src=%-12s %d" % (src, n))


def cmd_export(a):
    w = csv.writer(sys.stdout)
    w.writerow(["id", "first_seen", "last_seen", "hits", "src"])
    for row in connect(a.db).execute("SELECT id, first_seen, last_seen, hits, src FROM visits ORDER BY first_seen"):
        w.writerow(row)


def cmd_backup(a):
    src = connect(a.db)
    dst = sqlite3.connect(a.out)
    src.backup(dst)
    dst.close()
    print("Kopia zapisana:", a.out)


def cmd_reset(a):
    conn = connect(a.db)
    with conn:
        conn.execute("DELETE FROM visits")
    conn.execute("VACUUM")
    print("Licznik wyzerowany.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    default_db = os.path.join(HERE, "data", "counter.db")

    def add(name, fn, **kw):
        p = sub.add_parser(name)
        p.add_argument("--db", default=default_db)
        p.set_defaults(fn=fn)
        return p

    p = add("serve", cmd_serve)
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8085)
    p.add_argument("--root", default=os.path.join(HERE, "..", "dist"))
    p.add_argument("--live", default=os.path.join(HERE, "live.html"))
    p.add_argument("-v", "--verbose", action="store_true")
    p.add_argument("--nasa-key", default=os.environ.get("NASA_API_KEY", "DEMO_KEY"), help="klucz NASA Open APIs (darmowy: api.nasa.gov); domyślnie $NASA_API_KEY albo DEMO_KEY z niskim limitem")
    p.add_argument("--nasa-every", type=int, default=None, metavar="SEK", help="co ile sekund odświeżać dane NASA (domyślnie 300, a z DEMO_KEY 1800)")
    p.add_argument("--dev-nick", action="append", default=[], metavar="NICK", help="konto z tym pseudonimem (albo NICK#TAG) dostaje tryb deweloperski, można podać kilka razy")
    p.add_argument("--dev", action="store_true", help="włącz tryb deweloperski ?dev=<gra> w przeglądarce")
    add("stats", cmd_stats)
    add("export", cmd_export)
    add("backup", cmd_backup).add_argument("--out", required=True)
    add("reset", cmd_reset)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
