#!/usr/bin/env python3
"""AstroMeow – serwer gry + licznik unikalnych wejść (SQLite, tylko biblioteka standardowa).

  python3 server.py serve   [--port 8085] [--db data/counter.db] [--root ../dist] [--live live.html]
  python3 server.py stats   [--db ...]
  python3 server.py export  [--db ...]            # CSV na stdout
  python3 server.py backup  [--db ...] --out plik.db
  python3 server.py reset   [--db ...]

Unikalność = cookie `vid` (losowe UUID). Wejście liczy się, gdy gra wyśle POST /api/hit.
"""
import argparse, csv, json, mimetypes, os, posixpath, re, signal, sqlite3, sys, threading, time, uuid
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

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
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.executescript(SCHEMA)
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
        by_src = conn.execute("SELECT src, COUNT(*) FROM visits GROUP BY src ORDER BY 2 DESC").fetchall()
    return {
        "unique": unique, "hits": hits, "active5": active5, "new1": new1,
        "by_src": {(s or "(brak)"): n for s, n in by_src}, "ts": now,
    }


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

    def _file(self, full, head=False):
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        with open(full, "rb") as f:
            self._send(200, f.read(), ctype, head=head)

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
        if path == "/api/stats":
            return self._json(get_stats(self.server.conn, self.server.lock), head=head)
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


# ---------- komendy ----------
def cmd_serve(a):
    srv = ThreadingHTTPServer((a.host, a.port), Handler)
    srv.daemon_threads = True
    srv.conn = connect(a.db)
    srv.lock = threading.Lock()
    srv.root = os.path.realpath(a.root)
    srv.live = os.path.abspath(a.live)
    srv.verbose = a.verbose
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
    add("stats", cmd_stats)
    add("export", cmd_export)
    add("backup", cmd_backup).add_argument("--out", required=True)
    add("reset", cmd_reset)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
