"""Najnowsze dane NASA do panelu w Ciekawostkach (źródła ze strony wyzwania: NASA Open APIs).

  DONKI (pogoda kosmiczna): rozbłyski słoneczne FLR, koronalne wyrzuty masy CME, burze geomagnetyczne GST
  APOD  (astronomiczny obraz dnia)

Serwer odświeża dane w tle co 30 minut i zapisuje je w pliku, więc gracze nie uderzają w API (klucz DEMO_KEY ma
limit 30 zapytań na godzinę z jednego adresu). Przy błędzie jednego źródła reszta nadal się pokazuje, a przy
braku sieci zostają ostatnie dobre dane. Klucz: zmienna NASA_API_KEY albo --nasa-key (darmowy: https://api.nasa.gov).
"""
import datetime, json, os, threading, time, urllib.parse, urllib.request

BASE = "https://api.nasa.gov"
EVERY = 1800          # s między odświeżeniami
WINDOW_DAYS = 30      # jak daleko wstecz szukamy zdarzeń pogody kosmicznej


def _fetch(path, key, **params):
    query = urllib.parse.urlencode({**params, "api_key": key})
    with urllib.request.urlopen("%s%s?%s" % (BASE, path, query), timeout=15) as r:
        return json.load(r)


def _latest(items, field):
    items = [i for i in items or [] if isinstance(i, dict) and i.get(field)]
    return max(items, key=lambda i: i[field]) if items else None


def parse_flare(items):
    f = _latest(items, "beginTime")
    if not f or not f.get("classType"):
        return None
    return {"class": f["classType"], "time": f["beginTime"], "region": f.get("activeRegionNum")}


def parse_storm(items):
    g = _latest(items, "startTime")
    kps = [k["kpIndex"] for k in (g or {}).get("allKpIndex") or [] if isinstance(k.get("kpIndex"), (int, float))]
    return {"kp": max(kps), "time": g["startTime"]} if kps else None


def parse_cme(items):
    c = _latest(items, "startTime")
    if not c:
        return None
    speeds = [a["speed"] for a in c.get("cmeAnalyses") or [] if isinstance(a.get("speed"), (int, float))]
    return {"time": c["startTime"], "speed": round(max(speeds)) if speeds else None}


def parse_apod(d):
    if not isinstance(d, dict) or d.get("media_type") != "image" or not str(d.get("url", "")).startswith("https://"):
        return None
    return {"title": d.get("title", ""), "url": d["url"], "date": d.get("date", ""), "credit": d.get("copyright", "NASA").strip()}


def build(key, fetch=_fetch, today=None):
    today = today or datetime.date.today()
    window = {"startDate": str(today - datetime.timedelta(days=WINDOW_DAYS)), "endDate": str(today)}
    out = {"updated": int(time.time())}
    for name, parse, path, params in (
        ("flare", parse_flare, "/DONKI/FLR", window), ("storm", parse_storm, "/DONKI/GST", window),
        ("cme", parse_cme, "/DONKI/CME", window), ("apod", parse_apod, "/planetary/apod", {}),
    ):
        try:
            out[name] = parse(fetch(path, key, **params))
        except Exception as exc:   # jedno źródło nie może położyć reszty (limit, brak sieci)
            out[name] = None
            out.setdefault("errors", []).append("%s: %s" % (name, exc))
    return out


class Cache:
    def __init__(self, key, path):
        self.key, self.path, self.data, self.lock = key, path, {"updated": None}, threading.Lock()
        try:
            self.data = json.load(open(path))
        except (OSError, ValueError):
            pass

    def refresh(self):
        fresh = build(self.key)
        with self.lock:
            old = self.data
            for name in ("flare", "storm", "cme", "apod"):   # pusty wynik nie kasuje ostatnich dobrych danych
                if fresh.get(name) is None and old.get(name):
                    fresh[name] = old[name]
            if any(fresh.get(n) for n in ("flare", "storm", "cme", "apod")):
                self.data = fresh
                try:
                    json.dump(fresh, open(self.path, "w"))
                except OSError:
                    pass

    def get(self):
        with self.lock:
            return {k: v for k, v in self.data.items() if k != "errors"}

    def start(self, every=EVERY):
        def loop():
            while True:
                try:
                    self.refresh()
                except Exception:
                    pass
                time.sleep(every)
        threading.Thread(target=loop, daemon=True).start()
