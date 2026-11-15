"""Najnowsze dane NASA do panelu w Ciekawostkach (źródła ze strony wyzwania: NASA Open APIs).

  DONKI (pogoda kosmiczna): rozbłyski słoneczne FLR, koronalne wyrzuty masy CME, burze geomagnetyczne GST
  APOD  (astronomiczny obraz dnia)

Serwer odświeża dane w tle co 30 minut i zapisuje je w pliku, więc gracze nie uderzają w API (klucz DEMO_KEY ma
limit 30 zapytań na godzinę z jednego adresu). Przy błędzie jednego źródła reszta nadal się pokazuje, a przy
braku sieci zostają ostatnie dobre dane. Klucz: zmienna NASA_API_KEY albo --nasa-key (darmowy: https://api.nasa.gov).
"""
import datetime, json, os, threading, time, urllib.error, urllib.parse, urllib.request

BASE = "https://api.nasa.gov"
EVERY = 300           # s między odświeżeniami DONKI (3 zapytania, ok. 36 na godzinę)
EVERY_DEMO = 1800     # z DEMO_KEY (30 zapytań na godzinę z jednego adresu) odświeżamy rzadziej
APOD_EVERY = 3600     # APOD zmienia się raz na dobę, więc wystarczy co godzinę
WINDOW_DAYS = 30      # jak daleko wstecz szukamy zdarzeń pogody kosmicznej
RETRY_PAUSE = 2       # s między ponownymi próbami APOD


def _fetch(path, key, **params):
    query = urllib.parse.urlencode({**params, "api_key": key})
    for attempt in (1, 2):   # NASA czasem odpowiada chwilowym 5xx (APOD), więc jedna ponowna próba
        try:
            with urllib.request.urlopen("%s%s?%s" % (BASE, path, query), timeout=15) as r:
                return json.load(r)
        except urllib.error.HTTPError as exc:
            if exc.code < 500 or attempt == 2:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(2)


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
    if "nasa-logo" in d["url"]:   # w czasie awarii APOD NASA zwraca zamiast obrazu dnia samo logo
        return None
    return {"title": d.get("title", ""), "url": d["url"], "date": d.get("date", ""), "credit": d.get("copyright", "NASA").strip()}


def build(key, fetch=_fetch, today=None, skip=()):
    today = today or datetime.date.today()
    window = {"startDate": str(today - datetime.timedelta(days=WINDOW_DAYS)), "endDate": str(today)}
    out, errors = {"updated": int(time.time())}, []
    for name, parse, path, params in (
        ("flare", parse_flare, "/DONKI/FLR", window), ("storm", parse_storm, "/DONKI/GST", window),
        ("cme", parse_cme, "/DONKI/CME", window), ("apod", parse_apod, "/planetary/apod", {}),
    ):
        out[name], error = None, None
        if name in skip:   # nie pobieramy: Cache.refresh zostawi ostatnie dobre dane
            continue
        for attempt in range(3 if name == "apod" else 1):   # APOD bywa niestabilny (5xx albo samo logo zamiast obrazu)
            try:
                out[name], error = parse(fetch(path, key, **params)), None
            except Exception as exc:   # jedno źródło nie może położyć reszty (limit, brak sieci)
                error = "%s: %s" % (name, exc)
            if out[name] or attempt == 2 or name != "apod":
                break
            time.sleep(RETRY_PAUSE)
        if error:
            errors.append(error)
    if errors:
        out["errors"] = errors
    return out


class Cache:
    def __init__(self, key, path):
        self.key, self.path, self.data, self.lock = key, path, {"updated": None}, threading.Lock()
        self.apod_at = 0   # kiedy ostatnio próbowaliśmy pobrać APOD
        try:
            self.data = json.load(open(path))
        except (OSError, ValueError):
            pass

    def refresh(self):
        now = time.time()
        want_apod = now - self.apod_at >= APOD_EVERY
        fresh = build(self.key, skip=() if want_apod else ("apod",))
        if want_apod:   # po udanym pobraniu czekamy godzinę, po nieudanym (awaria, logo) ponawiamy za 15 minut
            self.apod_at = now if fresh.get("apod") else now - APOD_EVERY + 900
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

    def start(self, every=None):
        every = every or (EVERY_DEMO if self.key == "DEMO_KEY" else EVERY)

        def loop():
            while True:
                try:
                    self.refresh()
                except Exception:
                    pass
                time.sleep(every)
        threading.Thread(target=loop, daemon=True).start()
