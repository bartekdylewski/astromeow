#!/usr/bin/env python3
"""Przygotowanie konta do nagrywania dema na działającym serwerze (bez --dev).

Stan gry (misje, zasoby, zabudowane planety) leży w przeglądarce gracza (localStorage), nie w bazie serwera,
więc skrypt robi dwie rzeczy:
  1. w bazie podbija wyniki gracza w rankingu (tylko w górę, kopia pierwotnych wyników trafia do pliku .json),
  2. zapisuje i wypisuje fragment JS do wklejenia w konsoli przeglądarki gracza (F12 > Console) na stronie gry:
     wczytuje przykładowy stan z demoState() i otwiera Bazę.

  python3 counter/demo_account.py              # podgląd: nic nie zapisuje
  python3 counter/demo_account.py --apply      # kopia bazy + podbicie wyników
  python3 counter/demo_account.py --undo       # przywrócenie pierwotnych wyników
  python3 counter/demo_account.py --nick Dylu --apply

Wymaga gry zbudowanej po dodaniu demoState (bash run.sh przebudowuje dist przy każdym starcie).
"""
import argparse, json, os, shutil, sqlite3, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, 'data', 'counter.db')
STATE = os.path.join(HERE, 'data', 'demo-account-scores.json')   # pierwotne wyniki do --undo
SNIPPET = os.path.join(HERE, 'data', 'demo-account.js')
DEMO_SCORES = {'flappy': 24, 'shooter': 31, 'catch': 57}          # wyniki do rankingu w demie
CALM = 0.02   # mnożnik produkcji na czas nagrania (bez tego liczby rosną do dziesiątek tysięcy)

SNIPPET_JS = (
    "demoState(); P.res = {wiedza: 468, czesci: 393, meteo: 285}; save();\n"
    "const _r = rates; rates = () => { const r = _r(); for (const k in r) r[k] *= %s; return r; };\n"
    "setTab('base');" % CALM
)


def find_player(conn, nick):
    row = conn.execute('SELECT id, nickname FROM players WHERE name_key=?', (nick.lower(),)).fetchone()
    if not row:
        sys.exit('Brak gracza "%s" w bazie. Wejdź do gry z tego urządzenia i ustaw pseudonim.' % nick)
    return row


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--db', default=DB)
    ap.add_argument('--nick', default='Dylu')
    ap.add_argument('--apply', action='store_true', help='zapisz zmiany (bez tego tylko podgląd)')
    ap.add_argument('--undo', action='store_true', help='przywróć wyniki sprzed --apply')
    a = ap.parse_args()
    if not os.path.isfile(a.db):
        sys.exit('Brak bazy: %s' % a.db)
    conn = sqlite3.connect(a.db, timeout=10)
    pid, nick = find_player(conn, a.nick)
    cur = dict(conn.execute('SELECT game, score FROM scores WHERE player=?', (pid,)).fetchall())
    print('Gracz: %s (id %d)  obecne wyniki: %s' % (nick, pid, cur or 'brak'))

    if a.undo:
        if not os.path.isfile(STATE):
            sys.exit('Brak %s, nie ma czego przywracać.' % STATE)
        saved = json.load(open(STATE))
        with conn:
            conn.execute('DELETE FROM scores WHERE player=?', (pid,))
            conn.executemany('INSERT INTO scores(player, game, score) VALUES (?,?,?)', [(pid, g, s) for g, s in saved.items()])
        os.remove(STATE)
        print('Przywrócono wyniki:', saved or 'brak')
        return

    new = {g: max(cur.get(g, 0), s) for g, s in DEMO_SCORES.items()}   # tylko w górę
    print('Po zmianie:', {**cur, **new})
    if a.apply:
        backup = '%s.demo-%s' % (a.db, time.strftime('%Y%m%d-%H%M%S'))
        shutil.copy(a.db, backup)
        if not os.path.isfile(STATE):   # pierwotne wyniki zapisujemy tylko za pierwszym razem
            json.dump(cur, open(STATE, 'w'))
        with conn:
            for g, s in new.items():
                conn.execute('INSERT INTO scores(player, game, score) VALUES (?,?,?) '
                             'ON CONFLICT(player, game) DO UPDATE SET score = excluded.score', (pid, g, s))
        print('Zapisano. Kopia bazy:', backup)
    else:
        print('(podgląd: dopisz --apply, żeby zapisać)')

    with open(SNIPPET, 'w') as f:
        f.write(SNIPPET_JS + '\n')
    print('\nWklej w konsoli przeglądarki (F12 > Console) na stronie gry, na koncie %s:\n' % nick)
    print(SNIPPET_JS)
    print('\n(zapisane też w %s; odświeżenie strony przywraca zwykłą produkcję zasobów)' % SNIPPET)


if __name__ == '__main__':
    main()
