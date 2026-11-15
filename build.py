#!/usr/bin/env python3
"""Skleja cały projekt w jeden plik dist/astromeow.html (do hostowania / wysłania komuś).
Kot (cat/*.webp) jest wbudowany w ten plik, więc dist/astromeow.html działa sam, bez folderu cat/.
Dane z config/*.json (etapy, pytania, lekcje, ciekawostki) są sprawdzane i wbudowane jako window.DATA_EMBED.
Uruchom:  python3 build.py"""
import re, os, glob, base64, json, sys
here = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(here, 'index.html'), encoding='utf-8').read()
def css(m): return '<style>\n' + open(os.path.join(here, m.group(1)), encoding='utf-8').read() + '</style>'
def js(m):  return '<script>\n' + open(os.path.join(here, m.group(1)), encoding='utf-8').read() + '</script>'
html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', css, html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', js, html)
# ---------- dane z config/*.json: wczytanie + walidacja ----------
def check_stages(d):
    """Zwraca (bledy, ostrzezenia) po polsku dla config/missions.json."""
    E, W = [], []
    if not isinstance(d, dict): return ['missions.json: na górze musi być obiekt { "difficulties": [...], "stages": [...] }'], W
    diffs = d.get('difficulties')
    if not isinstance(diffs, list) or not diffs: return ['missions.json: brak listy "difficulties" (poziomy trudności)'], W
    tiers, seen_t = [], set()
    for i, t in enumerate(diffs, 1):
        if not isinstance(t, dict): E.append('poziom nr %d: powinien być obiektem {...}' % i); continue
        for k in ('id', 'name', 'icon', 'desc'):
            if not isinstance(t.get(k), str) or not t.get(k).strip(): E.append('poziom nr %d: brakuje pola "%s" (tekst)' % (i, k))
        if not isinstance(t.get('mult'), (int, float)) or isinstance(t.get('mult'), bool): E.append('poziom nr %d: pole "mult" musi być liczbą, np. 1.5' % i)
        if t.get('id') in seen_t: E.append('poziom "%s" występuje dwa razy' % t.get('id'))
        seen_t.add(t.get('id')); tiers.append(t.get('id'))
    stages = d.get('stages')
    if not isinstance(stages, list) or not stages: return E + ['missions.json: brak listy "stages" (etapy)'], W
    ids = set()
    for n, s in enumerate(stages, 1):
        if not isinstance(s, dict): E.append('etap nr %d: powinien być obiektem {...}' % n); continue
        sid = s.get('id'); where = 'etap %s (%s)' % (sid, s.get('title', 'bez tytułu'))
        if not isinstance(sid, int) or isinstance(sid, bool): E.append('etap nr %d: pole "id" musi być liczbą całkowitą, np. 7' % n); where = 'etap nr %d' % n
        elif sid in ids: E.append('%s: id %s powtarza się, każdy etap musi mieć inne "id"' % (where, sid))
        ids.add(sid)
        for k in ('title', 'icon', 'topic'):
            if not isinstance(s.get(k), str) or not s.get(k).strip(): E.append('%s: brakuje pola "%s" (tekst)' % (where, k))
        qs = s.get('questions')
        if not isinstance(qs, dict): E.append('%s: brakuje obiektu "questions" z poziomami (%s)' % (where, ', '.join(map(str, tiers)))); qs = {}
        for t in qs:
            if t not in tiers: E.append('%s: nieznany poziom "%s" w "questions" (dozwolone: %s)' % (where, t, ', '.join(map(str, tiers))))
        for t in tiers:
            lst = qs.get(t)
            if not isinstance(lst, list) or not lst: E.append('%s, poziom "%s": brak pytań (potrzeba co najmniej 1, najlepiej 5 lub więcej)' % (where, t)); continue
            if len(lst) < 5: W.append('%s, poziom "%s": tylko %d pytań (zalecane co najmniej 5)' % (where, t, len(lst)))
            qtexts = set()
            for j, q in enumerate(lst, 1):
                w = '%s, poziom "%s", pytanie %d' % (where, t, j)
                if not isinstance(q, dict): E.append(w + ': powinno być obiektem {...}'); continue
                if not isinstance(q.get('q'), str) or not q['q'].strip(): E.append(w + ': brakuje treści pytania "q"')
                elif q['q'] in qtexts: E.append(w + ': to samo pytanie jest już na liście (%s)' % q['q'])
                else: qtexts.add(q['q'])
                if not isinstance(q.get('a'), str) or not q['a'].strip(): E.append(w + ' (%s): brakuje poprawnej odpowiedzi "a" (dokładnie jedna)' % q.get('q', '?'))
                ww = q.get('w')
                if not isinstance(ww, list) or len(ww) != 3 or not all(isinstance(x, str) and x.strip() for x in ww):
                    E.append(w + ' (%s): "w" to lista dokładnie 3 złych odpowiedzi, a jest %s' % (q.get('q', '?'), ('%d' % len(ww)) if isinstance(ww, list) else 'brak listy'))
                elif q.get('a') in ww or len(set(ww)) != 3: E.append(w + ' (%s): odpowiedzi muszą być różne (poprawna nie może się powtarzać wśród złych)' % q.get('q', '?'))
                if 'f' in q and not isinstance(q['f'], str): E.append(w + ': ciekawostka "f" musi być tekstem')
        les = s.get('lesson')
        if les is None: W.append('%s: brak lekcji "lesson" (etap zadziała, ale bez tutorialu)' % where); continue
        if isinstance(les, list): groups = {'wszystkie poziomy': les}
        elif isinstance(les, dict): groups = {k: v for k, v in les.items()}
        else: E.append('%s: "lesson" to lista kart albo obiekt z poziomami' % where); continue
        for g, cards in groups.items():
            if g not in tiers and g not in ('all', 'wszystkie poziomy'): E.append('%s: lekcja ma nieznany poziom "%s"' % (where, g)); continue
            if not isinstance(cards, list) or not cards: E.append('%s, lekcja "%s": powinna być niepustą listą kart' % (where, g)); continue
            if not 2 <= len(cards) <= 4: W.append('%s, lekcja "%s": %d kart (zalecane 2 do 4)' % (where, g, len(cards)))
            for j, c in enumerate(cards, 1):
                for k in ('title', 'text', 'icon'):
                    if not isinstance(c, dict) or not isinstance(c.get(k), str) or not c[k].strip(): E.append('%s, lekcja "%s", karta %d: brakuje pola "%s"' % (where, g, j, k))
        if isinstance(les, dict) and not any(k in les for k in tiers + ['all']): E.append('%s: lekcja nie ma żadnego poziomu' % where)
    return E, W

def load_data():
    data, errors, warns = {}, [], []
    for p in sorted(glob.glob(os.path.join(here, 'config', '*.json'))):
        name = os.path.splitext(os.path.basename(p))[0]
        try:
            data[name] = json.load(open(p, encoding='utf-8'))
        except ValueError as e:
            errors.append('config/%s.json: niepoprawny JSON (%s). Najczęściej brakuje przecinka albo cudzysłowu.' % (name, e))
            continue
    if 'missions' in data and 'tutorials' in data:
        missions = data['missions']
        if isinstance(missions, dict) and isinstance(missions.get('stages'), list):
            lessons = data['tutorials'].get('lessons', {})
            missions = {**missions, 'stages': [{**stage, **({'lesson': lessons[str(stage.get('id'))]} if str(stage.get('id')) in lessons else {})} if isinstance(stage, dict) else stage for stage in missions['stages']]}
        e, w = check_stages(missions)
        errors += ['config/missions.json: ' + x for x in e]; warns += ['config/missions.json: ' + x for x in w]
    for required in ('missions', 'tutorials', 'ciekawostki'):
        if required not in data and not any(x.startswith(f'config/{required}.json') for x in errors):
            errors.append(f'brak pliku config/{required}.json')
    for c in (data.get('ciekawostki') or {}).get('categories', []) if isinstance(data.get('ciekawostki'), dict) else []:
        if not os.path.exists(os.path.join(here, 'assets', 'facts', str(c.get('icon')) if '.' in str(c.get('icon')) else '%s.svg' % c.get('icon'))): errors.append('config/ciekawostki.json: kategoria "%s": brak pliku assets/facts/ dla icon "%s" (bez rozszerzenia = .svg)' % (c.get('id'), c.get('icon')))
    for lang in ('pl', 'en'):
        with open(os.path.join(here, 'config', f'blocked-words.{lang}.txt'), encoding='utf-8') as f:
            data[f'blocked-words.{lang}'] = f.read().splitlines()
    for w in warns: print('UWAGA', w)
    if errors:
        print('\nBŁĘDY w danych (%d), popraw i uruchom ponownie:' % len(errors))
        for x in errors: print(' -', x)
        sys.exit(1)
    return data

# wbudowanie kota: pozy idle/happy/sad/think/cheer jako data-URI
emb = {}
for p in sorted(glob.glob(os.path.join(here, 'cat', '*.webp'))):
    name = os.path.splitext(os.path.basename(p))[0]
    if name in ('idle', 'happy', 'sad', 'think', 'cheer'):
        emb[name] = 'data:image/webp;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
data = load_data()
icons = {}
for path in sorted(glob.glob(os.path.join(here, 'assets', 'icons', '*.svg'))):
    with open(path, 'rb') as source:
        icons[os.path.splitext(os.path.basename(path))[0]] = 'data:image/svg+xml;base64,' + base64.b64encode(source.read()).decode()
html = re.sub(r'src="assets/icons/([a-z]+)\.svg"', lambda m: 'src="' + icons[m.group(1)] + '"', html)
tags = '<script>window.ICON_EMBED=' + json.dumps(icons) + ';</script>\n'
# pozostałe grafiki z assets/ (flappy, skiny, ciekawostki...) jako ASSET_EMBED = { 'assets/x/y.webp': data-URI }; w JS: assetSrc('assets/x/y.webp')
MIME = {'.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml'}
assets = {}
for path in sorted(glob.glob(os.path.join(here, 'assets', '**', '*.*'), recursive=True)):
    rel = os.path.relpath(path, here).replace(os.sep, '/')
    ext = os.path.splitext(path)[1].lower()
    if rel.startswith('assets/icons/') or ext not in MIME: continue
    assets[rel] = 'data:' + MIME[ext] + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()
tags += '<script>window.ASSET_EMBED=' + json.dumps(assets) + ';</script>\n'
if emb: tags += '<script>window.CAT_EMBED=' + json.dumps(emb) + ';</script>\n'
# wszystkie config/*.json wbudowane jako DATA_EMBED = { nazwa_pliku: zawartość }
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
tags += '<script>window.DATA_EMBED=' + blob + ';</script>\n'
html = html.replace('<script>', tags + '<script>', 1)
os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
out = os.path.join(here, 'dist', 'astromeow.html')
open(out, 'w', encoding='utf-8').write(html)
print('OK ->', out, len(html) // 1024, 'KB', '(kot: %s; dane: %s)' % (', '.join(emb) or 'brak', ', '.join(data)))
