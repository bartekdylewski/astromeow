"""Pokazuje nicki łamiące aktualne zasady (players.nickname_problem); z --apply je resetuje.

Reset: nick = NULL i usunięte wyniki tego gracza, więc przy następnym wejściu gra poprosi o nowy nick.
Użycie: python3 counter/reset_bad_nicks.py [ścieżka.db] [--apply]   (najpierw: bash counter/counter.sh backup)
"""
import sqlite3
import sys
from pathlib import Path

from players import nickname_problem

args = [a for a in sys.argv[1:] if a != '--apply']
db = args[0] if args else Path(__file__).resolve().parent / 'data' / 'counter.db'
conn = sqlite3.connect(db)
rows = conn.execute('SELECT id, nickname FROM players WHERE nickname IS NOT NULL ORDER BY id').fetchall()
bad = {pid: nickname_problem(nick) for pid, nick in rows if nickname_problem(nick)}
print(f'Nicki: {len(rows)}, do resetu: {len(bad)}')
for pid, nick in rows:
    print(f"{'✗' if pid in bad else ' '} {pid:>5}  {nick:<20} {bad.get(pid) or ''}")
if '--apply' in sys.argv and bad:
    with conn:
        for pid in bad:
            conn.execute('DELETE FROM scores WHERE player=?', (pid,))
            conn.execute('UPDATE players SET nickname=NULL, name_key=NULL, tag=NULL WHERE id=?', (pid,))
    print(f'Zresetowano {len(bad)}.')
elif bad:
    print('Podgląd. Żeby zresetować, dodaj --apply.')
