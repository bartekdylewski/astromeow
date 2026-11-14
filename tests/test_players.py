import sqlite3
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'counter'))
import players


class PlayerTests(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect(':memory:')
        self.addCleanup(self.conn.close)
        self.conn.executescript(players.SCHEMA)

    def api(self, route, token='', **data):
        with self.conn:
            return players.player_api(self.conn, route, data, token)

    def player(self, nickname):
        _, token = self.api('session')
        return self.api('profile', token, nickname=nickname, pitch=-4)[0], token

    def score(self, token, points, game='flappy', duration=3):
        with patch.object(players.time, 'time', return_value=1000):
            ticket, _ = self.api('run/start', token, game=game)
        with patch.object(players.time, 'time', return_value=1000 + duration):
            return self.api('run/finish', token, game=game, score=points, **ticket)[0]

    def rejects(self, status, route, token='', **data):
        with self.assertRaises(players.ApiError) as error:
            self.api(route, token, **data)
        self.assertEqual(error.exception.status, status)

    def test_session_and_duplicate_tags_stay_bound_to_profiles(self):
        p1, t1 = self.player('Kuba')
        p2, _ = self.player('kuba')
        self.assertRegex(p1['tag'], r'^\d{4}$')
        self.assertNotEqual(p1['tag'], p2['tag'])
        self.assertEqual(self.api('session', t1), (p1, None))
        self.assertEqual(p1['pitch'], -4)
        self.assertTrue(p1['firstGame'])

    def test_blocklist_handles_leetspeak_phrases_and_whole_words(self):
        _, token = self.api('session')
        for name in ('KURW4', 'Zabij_się', 'p13rdolony', 'nice_sh1t'):
            with self.subTest(name=name):
                self.rejects(400, 'profile', token, nickname=name, pitch=0)
        profile, _ = self.api('profile', token, nickname='Klasyczny Cass', pitch=0)
        self.assertEqual(profile['nickname'], 'Klasyczny Cass')

    def test_rank_gap_ties_best_score_and_game_isolation(self):
        _, top = self.player('Zosia')
        _, rival = self.player('KUBA')
        _, you = self.player('Kuba')
        self.score(top, 12)
        self.score(rival, 8)
        board = self.score(you, 8)
        self.assertEqual([row['rank'] for row in board['top']], [1, 2, 2])
        self.assertEqual(board['top'][0]['name'], 'Zosia')
        self.assertRegex(board['you']['name'], r'^Kuba#\d{4}$')
        self.assertEqual((board['you']['gapNext'], board['you']['gapFirst']), (4, 4))
        self.assertEqual(self.score(you, 3)['you']['score'], 8)
        self.assertEqual(self.score(you, 2, game='pack')['total'], 1)

    def test_score_validates_owner_game_duration_cap_and_single_use(self):
        _, t1 = self.player('Ada')
        _, t2 = self.player('Iga')
        with patch.object(players.time, 'time', return_value=1000):
            ticket, _ = self.api('run/start', t1, game='flappy')
            self.rejects(409, 'run/finish', t1, game='flappy', score=2, **ticket)
        with patch.object(players.time, 'time', return_value=1005):
            self.rejects(409, 'run/finish', t2, game='flappy', score=2, **ticket)
            self.rejects(409, 'run/finish', t1, game='pack', score=2, **ticket)
            self.rejects(400, 'run/finish', t1, game='flappy', score=1000, **ticket)
            self.api('run/finish', t1, game='flappy', score=2, **ticket)
            self.rejects(409, 'run/finish', t1, game='flappy', score=2, **ticket)
        self.assertFalse(self.api('session', t1)[0]['firstGame'])

    def test_run_start_is_rate_limited_per_player(self):
        _, token = self.player('Ela')
        _, other = self.player('Maja')
        with patch.object(players.time, 'time', return_value=1000):
            for _ in range(15):
                self.api('run/start', token, game='flappy')
            self.rejects(429, 'run/start', token, game='flappy')
            self.api('run/start', other, game='flappy')


if __name__ == '__main__':
    unittest.main()
