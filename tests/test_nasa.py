import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'counter'))
import nasa

# przykładowe odpowiedzi w formacie DONKI i APOD (wymyślone wartości, tylko do testu parsowania)
FLR = [{'beginTime': '2026-11-10T04:00Z', 'classType': 'C2.1', 'activeRegionNum': 100},
       {'beginTime': '2026-11-13T09:30Z', 'classType': 'M1.4', 'activeRegionNum': 101}]
GST = [{'startTime': '2026-11-12T00:00Z', 'allKpIndex': [{'kpIndex': 4.33}, {'kpIndex': 6.0}]}]
CME = [{'startTime': '2026-11-14T01:00Z', 'cmeAnalyses': [{'speed': 640.2}, {'speed': 810.7}]}]
APOD = {'media_type': 'image', 'url': 'https://apod.nasa.gov/x.jpg', 'title': 'T', 'date': '2026-11-15', 'copyright': ' Ktos '}


class NasaTests(unittest.TestCase):
    def test_parsers_pick_latest_event(self):
        self.assertEqual(nasa.parse_flare(FLR), {'class': 'M1.4', 'time': '2026-11-13T09:30Z', 'region': 101})
        self.assertEqual(nasa.parse_storm(GST), {'kp': 6.0, 'time': '2026-11-12T00:00Z'})
        self.assertEqual(nasa.parse_cme(CME), {'time': '2026-11-14T01:00Z', 'speed': 811})
        self.assertEqual(nasa.parse_apod(APOD)['credit'], 'Ktos')

    def test_empty_and_bad_input(self):
        self.assertIsNone(nasa.parse_flare([]))
        self.assertIsNone(nasa.parse_storm(None))
        self.assertIsNone(nasa.parse_cme([{}]))
        self.assertIsNone(nasa.parse_apod({'media_type': 'video', 'url': 'https://x'}))
        self.assertIsNone(nasa.parse_apod({'media_type': 'image', 'url': 'http://insecure'}))

    def test_one_failing_source_does_not_break_the_rest(self):
        def fetch(path, key, **params):
            if path == '/DONKI/GST':
                raise OSError('limit')
            return {'/DONKI/FLR': FLR, '/DONKI/CME': CME, '/planetary/apod': APOD}[path]
        data = nasa.build('K', fetch)
        self.assertEqual(data['flare']['class'], 'M1.4')
        self.assertIsNone(data['storm'])
        self.assertIn('storm: limit', data['errors'][0])

    def test_apod_retries_when_nasa_returns_only_the_logo(self):
        logo = {'media_type': 'image', 'url': 'https://science.nasa.gov/x/nasa-logo@2x.png', 'title': 'NASA Science'}
        replies = iter([logo, APOD])
        with patch.object(nasa, 'RETRY_PAUSE', 0):
            data = nasa.build('K', lambda path, key, **p: next(replies) if path == '/planetary/apod' else [])
        self.assertEqual(data['apod']['title'], 'T')
        self.assertNotIn('errors', data)

    def test_skip_leaves_a_source_untouched(self):
        calls = []
        data = nasa.build('K', lambda path, key, **p: calls.append(path) or [], skip=('apod',))
        self.assertNotIn('/planetary/apod', calls)
        self.assertIsNone(data['apod'])

    def test_apod_is_fetched_hourly_but_donki_every_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            cache = nasa.Cache('K', str(Path(tmp) / 'c.json'))
            seen = []
            def fake(key, fetch=None, today=None, skip=()):
                seen.append(skip)
                return {'updated': 1, 'flare': None, 'storm': {'kp': 5}, 'cme': None, 'apod': {'title': 'T'}}
            with patch.object(nasa, 'build', fake):
                cache.refresh()   # pierwszy raz pobiera APOD
                cache.refresh()   # tuż potem pomija APOD, DONKI dalej pobiera
            self.assertEqual(seen, [(), ('apod',)])
            self.assertEqual(cache.get()['apod'], {'title': 'T'})   # zostaje z poprzedniego odświeżenia

    def test_interval_depends_on_key(self):
        self.assertEqual(nasa.EVERY, 300)
        self.assertGreater(nasa.EVERY_DEMO, nasa.EVERY)

    def test_cache_keeps_last_good_data_and_hides_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            cache = nasa.Cache('K', str(Path(tmp) / 'c.json'))
            first = {'updated': 1, 'flare': {'class': 'X1'}, 'storm': None, 'cme': None, 'apod': None, 'errors': ['x']}
            second = {'updated': 2, 'flare': None, 'storm': {'kp': 5}, 'cme': None, 'apod': None}
            with patch.object(nasa, 'build', return_value=first):
                cache.refresh()
            with patch.object(nasa, 'build', return_value=second):
                cache.refresh()
            got = cache.get()
            self.assertEqual(got['flare'], {'class': 'X1'})   # zostaje z poprzedniego odświeżenia
            self.assertEqual(got['storm'], {'kp': 5})
            self.assertNotIn('errors', got)
            self.assertEqual(json.load(open(Path(tmp) / 'c.json'))['updated'], 2)


if __name__ == '__main__':
    unittest.main()
