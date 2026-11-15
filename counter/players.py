"""Persistent player profiles and per-game leaderboards."""
import hashlib
from pathlib import Path
import re
import secrets
import time
import unicodedata

SCHEMA = """
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY, token TEXT UNIQUE NOT NULL,
    nickname TEXT, name_key TEXT, tag INTEGER, pitch INTEGER NOT NULL DEFAULT 0,
    first_game INTEGER NOT NULL DEFAULT 0, UNIQUE(name_key, tag)
);
CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY, player INTEGER NOT NULL REFERENCES players(id),
    game TEXT NOT NULL, started REAL NOT NULL, closed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS player_runs ON runs(player, started);
CREATE TABLE IF NOT EXISTS scores (
    player INTEGER NOT NULL REFERENCES players(id), game TEXT NOT NULL, score INTEGER NOT NULL,
    PRIMARY KEY(player, game)
);
CREATE INDEX IF NOT EXISTS game_scores ON scores(game, score DESC);
"""

# gra: minimalny czas próby w s (wynik bez górnego limitu, liczy się ważny bilet runId)
GAMES = {'flappy': 1.5, 'shooter': 1, 'catch': 1, 'lander': 2, 'pack': 1}
RUN_TTL = 3600
CONFIG = Path(__file__).resolve().parent.parent / 'config'
LEET = str.maketrans('01345789łv', 'oieastbglw')   # v→w: "cvel" = "cwel"


def normalize_name(name):
    name = unicodedata.normalize('NFKD', name.casefold()).translate(LEET)
    return re.sub(r'[ _]+', ' ', ''.join(c for c in name if not unicodedata.combining(c))).strip()


def load_blocklist():
    patterns = []
    for lang in ('pl', 'en'):
        for word in (CONFIG / f'blocked-words.{lang}.txt').read_text(encoding='utf-8').splitlines():
            word = word.strip()
            if word:
                patterns.append(re.escape(normalize_name(word.rstrip('*'))) + (r'\w*' if word.endswith('*') else ''))
    return re.compile(r'(?<!\w)(?:' + '|'.join(patterns) + r')(?!\w)')


def squash(name):
    """Nick bez odstępów, ch→h, bez powtórzeń liter: "C w_e e l" → "cwel", "chuuj" → "huj"."""
    name = re.sub(r'[^a-z0-9]', '', normalize_name(name)).replace('ch', 'h')
    return re.sub(r'(.)\1+', r'\1', name)


def load_roots():
    roots = (CONFIG / 'blocked-roots.txt').read_text(encoding='utf-8').splitlines()
    return [squash(r) for r in roots if r.strip() and not r.startswith('#')]


BLOCKED = load_blocklist()
BLOCKED_ROOTS = load_roots()


def nickname_problem(nickname):
    """Komunikat dla dziecka, gdy nick łamie zasady, inaczej None."""
    if not 1 <= len(nickname) <= 16:
        return 'Nick musi mieć od 1 do 16 znaków.'
    if not re.fullmatch(r'[^\W\d_]+(?:[ _][^\W\d_]+)?\d{0,4}', nickname):
        return 'Nick to litery (najwyżej 2 słowa), cyfry tylko na końcu, np. Kuba7 albo Kosmiczny Kot.'
    name = normalize_name(nickname)
    if BLOCKED.search(name) or any(root in squash(nickname) for root in BLOCKED_ROOTS):
        return 'Ten nick zawiera niedozwolone słowo.'
    return None


class ApiError(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message


def profile(conn, player):
    nick, tag, pitch, first = conn.execute(
        'SELECT nickname, tag, pitch, first_game FROM players WHERE id=?', (player,)).fetchone()
    return {'nickname': nick, 'tag': f'{tag:04d}' if tag is not None else None,
            'pitch': pitch, 'firstGame': not first}


def player_api(conn, route, data, token):
    token_hash = hashlib.sha256(token.encode()).hexdigest() if token else None
    row = conn.execute('SELECT id FROM players WHERE token=?', (token_hash,)).fetchone()
    player = row[0] if row else None
    if route == 'session':
        if player is not None:
            return profile(conn, player), None
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        player = conn.execute('INSERT INTO players(token) VALUES (?)', (token_hash,)).lastrowid
        return profile(conn, player), token
    if player is None:
        raise ApiError(401, 'Sesja wygasła. Odśwież grę.')

    if route == 'profile':
        nickname = data.get('nickname')
        pitch = data.get('pitch')
        if type(pitch) is not int or not -12 <= pitch <= 12:
            raise ApiError(400, 'Wybierz prawidłową wysokość głosu.')
        if isinstance(nickname, str):
            nickname = unicodedata.normalize('NFC', nickname.strip())
        if not isinstance(nickname, str):
            raise ApiError(400, 'Nick musi mieć od 1 do 16 znaków.')
        problem = nickname_problem(nickname)
        if problem:
            raise ApiError(400, problem)
        key = nickname.casefold()
        old_key, tag = conn.execute('SELECT name_key, tag FROM players WHERE id=?', (player,)).fetchone()
        if key != old_key:
            used = {r[0] for r in conn.execute('SELECT tag FROM players WHERE name_key=?', (key,))}
            available = set(range(10000)) - used
            if not available:
                raise ApiError(409, 'Wybierz inny nick. Skończyły się numery dla tej nazwy.')
            tag = secrets.choice(tuple(available))
        conn.execute('UPDATE players SET nickname=?, name_key=?, tag=?, pitch=? WHERE id=?',
                     (nickname, key, tag, pitch, player))
        return profile(conn, player), None

    game = data.get('game')
    if not isinstance(game, str) or game not in GAMES:
        raise ApiError(400, 'Nieznana minigra.')
    if route == 'leaderboard':
        return leaderboard(conn, game, player), None
    if not profile(conn, player)['nickname']:
        raise ApiError(409, 'Najpierw zapisz nick.')

    now = time.time()
    if route == 'run/start':
        count = conn.execute('SELECT COUNT(*) FROM runs WHERE player=? AND started>?',
                             (player, now - 60)).fetchone()[0]
        if count >= 15:
            raise ApiError(429, 'Za dużo prób w krótkim czasie. Spróbuj za chwilę.')
        conn.execute('DELETE FROM runs WHERE player=? AND started<?', (player, now - RUN_TTL))
        conn.execute('UPDATE runs SET closed=1 WHERE player=? AND closed=0', (player,))
        run_id = secrets.token_urlsafe(24)
        conn.execute('INSERT INTO runs(id, player, game, started) VALUES (?,?,?,?)',
                     (run_id, player, game, now))
        conn.execute('UPDATE players SET first_game=1 WHERE id=?', (player,))
        return {'runId': run_id}, None

    score, run_id = data.get('score'), data.get('runId')
    minimum = GAMES[game]
    if type(score) is not int or score < 0 or not isinstance(run_id, str):
        raise ApiError(400, 'Nieprawidłowy wynik.')
    run = conn.execute('SELECT started FROM runs WHERE id=? AND player=? AND game=? AND closed=0',
                       (run_id, player, game)).fetchone()
    if not run or not minimum <= now - run[0] <= RUN_TTL:
        raise ApiError(409, 'Ta próba jest zamknięta albo trwała zbyt krótko.')
    conn.execute('UPDATE runs SET closed=1 WHERE id=?', (run_id,))
    conn.execute('INSERT INTO scores VALUES(?,?,?) ON CONFLICT(player,game) DO UPDATE '
                 'SET score=MAX(scores.score,excluded.score)', (player, game, score))
    return leaderboard(conn, game, player), None


def leaderboard(conn, game, player):
    sql = """WITH duplicates AS (
        SELECT name_key FROM players GROUP BY name_key HAVING COUNT(*) > 1
    ), ranked AS (
        SELECT s.player, p.nickname, p.tag, s.score,
            d.name_key IS NOT NULL AS duplicate,
            RANK() OVER (ORDER BY s.score DESC) AS rank,
            COUNT(*) OVER () AS total,
            MAX(s.score) OVER () AS best
        FROM scores s JOIN players p ON p.id=s.player
        LEFT JOIN duplicates d ON d.name_key=p.name_key WHERE s.game=?
    ) SELECT player, nickname, tag, score, duplicate, rank, total, best
      FROM ranked ORDER BY score DESC, player"""
    top = conn.execute(sql + ' LIMIT 10', (game,)).fetchall()
    own = conn.execute('SELECT score FROM scores WHERE player=? AND game=?', (player, game)).fetchone()

    def display(row):
        pid, nickname, tag, score, duplicate, rank, _, _ = row
        return {'name': f'{nickname}#{tag:04d}' if duplicate else nickname, 'score': score,
                'rank': rank, 'you': pid == player}

    you = None
    if own:
        score = own[0]
        rank, next_score = conn.execute(
            'SELECT COUNT(*)+1, MIN(score) FROM scores WHERE game=? AND score>?', (game, score)).fetchone()
        nickname, name_key, tag = conn.execute(
            'SELECT nickname, name_key, tag FROM players WHERE id=?', (player,)).fetchone()
        duplicate = conn.execute('SELECT COUNT(*)>1 FROM players WHERE name_key=?', (name_key,)).fetchone()[0]
        you = display((player, nickname, tag, score, duplicate, rank, 0, 0))
        you.update(gapNext=None if next_score is None else next_score - score, gapFirst=top[0][7] - score)
    return {'top': [display(row) for row in top], 'you': you, 'total': top[0][6] if top else 0}
