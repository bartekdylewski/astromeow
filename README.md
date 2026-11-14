# AstroMeow

Gra edukacyjna o kosmosie dla dzieci 7–12 lat (NASA Space Apps Stalowa Wola 2026).

## Uruchomienie
```bash
cloudflared tunnel --url http://127.0.0.1:8085

bash run.sh          # build + serwer + baza SQLite, Ctrl+C kończy
bash run.sh -d       # to samo w tle   (stop | status | logs)
```
Szczegóły, komendy i baza: sekcja [Licznik wejść](#licznik-wejść) niżej.

## Struktura
```
index.html          szkielet strony (ładuje pliki w kolejności)
run.sh              build + start/restart serwera z licznikiem (bash run.sh | -d | stop | status | logs)
build.py            skleja cały projekt w jeden plik dist/astromeow.html
counter/            licznik wejść: server.py (serwer + SQLite), live.html, counter.sh (reset/stats/test)
css/                style, w kolejności ładowania
  01-base           paleta (:root), nawigacja, przyciski, karty
  02-cat            kot i jego skiny
  03-quiz           ekran pytań i serca
  04-map            szlak MeowMission, planety
  05-tutorial       okienka tutoriali
  06-effects        konfetti, toast, animacje
  07-base-game      baza (planety i budynki)
  08-minigames      gierki i pakowanie rakiety
js/                 skrypty klasyczne (wspólny zakres, kolejność ma znaczenie)
  01-config         klucze, zapis
  02-layout         skalowanie (fit) pod pionowy laptop 9:16 i telefon
  03-cat            kot SVG / klatki z cat/, skiny
  04-reactions      brainrotowe reakcje na odpowiedzi
  00-data           ładowanie config/*.json (DATA)
  05-questions      buduje MISSIONS/DIFFS z config/missions.json (treść jest w JSON, nie tu)
  06-base-data      planety, budynki, dodatki
  07-state          stan gry, zapis, ekonomia bazy
  08-ui, 09-start, 10-home, 11-trail   ekrany: start, menu, szlak misji
  12-quiz           quiz, serca, złote życie
  13-minigames, 14-pack   gierki (canvas) i układanie rakiety
  15-results        wynik gierki / raport misji
  16-base, 17-shop, 18-tutorial, 19-badges   baza, sklep, tutoriale, odznaki
  20-router, 21-start-loop   akcje kliknięć i start aplikacji
  22-counter        zgłoszenie wejścia do licznika (POST /api/hit)
  23-facts          ekran Ciekawostki (zakładka "Ciekawostki"), style w css/09-facts.css
  24-sound          dźwięki Web Audio (klik, dobrze/źle, wynik, miau Astrusia); wyciszenie: 🔊 na ekranie głównym lub sfxToggle()
cat/                (opcjonalnie) klatki kota: idle_1.png … cheer_3.png albo idle.gif …
```

## Typowe zmiany
- Nowe etapy i pytania: `config/missions.json`. Lekcje i samouczki: `config/tutorials.json`, bez kodu. Instrukcja: [docs/JAK-DODAC-ETAP.md](docs/JAK-DODAC-ETAP.md). `python3 build.py` sprawdza dane i wypisze błędy po polsku.
- `config/*.json` są wbudowywane do `dist/astromeow.html` jako `window.DATA_EMBED`; w dev (index.html z serwera) ładuje je `js/00-data.js` przez fetch. Plik otwarty z `file://` bez builda pokaże komunikat Astrusia.
- Progi odblokowania planet i ich mnożniki: `js/06-base-data.js` (`PLANETS`).
- Skiny i ceny: `js/03-cat.js` (`SKINS`), cena złotego życia: `GOLD_PRICE`.
- Kolory: `css/01-base.css` (blok `:root`, ograniczona paleta, patrz „Wygląd i Astruś” niżej).

## Licznik wejść

Mały serwer w Pythonie (tylko biblioteka standardowa) + baza SQLite. Serwuje `dist/astromeow.html`, zlicza
**unikalne przeglądarki** (cookie z losowym ID) i pokazuje licznik na żywo pod `/live`. Działa za
`cloudflared tunnel`, więc nic nie trzeba przenosić na Cloudflare Pages.

### Tunel i aplikacja są niezależne

| | Co | Jak często |
|---|---|---|
| **Tunel** | `cloudflared tunnel --url http://127.0.0.1:8085` | **raz**, w osobnym terminalu/tmux, nie zamykaj. Adres `…trycloudflare.com` zostaje, dopóki ten proces żyje |
| **Aplikacja** | `bash run.sh` | **ile razy chcesz**: buduje grę, restartuje serwer pod tym samym portem, baza zostaje |

Podczas restartu aplikacji (1–2 s) tunel zwraca 502, potem znowu działa pod tym samym adresem. QR zrobisz raz
z adresu tunelu: `https://…trycloudflare.com/?src=scena`.

> Port w `run.sh` (domyślnie **8085**) musi być ten sam co w komendzie tunelu (inny: `PORT=9000 bash run.sh`).
> Nie zamykaj terminala z tunelem i nie usypiaj laptopa. Restart `cloudflared` = **nowy adres**, a wtedy QR
> przestaje działać, a cookie liczy wszystkich od nowa.

### Komendy

Z katalogu `astromeow/`:

| Komenda | Co robi |
|---|---|
| `bash run.sh` | build + (re)start w tym terminalu, Ctrl+C kończy |
| `bash run.sh -d` | to samo w tle, logi w `counter/data/server.log` |
| `bash run.sh stop` / `status` / `logs` | zatrzymaj / czy działa + statystyki / śledź logi |
| `bash counter/counter.sh stats` | statystyki z bazy (także gdy serwer stoi) |
| `bash counter/counter.sh reset` | kopia + wyzerowanie (**po testach, przed pokazem**) |
| `bash counter/counter.sh export` | CSV na stdout (`> wejscia.csv`) |
| `bash counter/counter.sh backup` | ręczna kopia bazy |
| `bash counter/counter.sh test` | 8 automatycznych sprawdzeń, nie rusza prawdziwej bazy |
| `bash counter/counter.sh install` | jednorazowo: sprawdza zależności, buduje grę, tworzy bazę |

Zmienne: `PORT=8085`, `DB=ścieżka`, `PYTHON=python3`, `KEEP=10` (ile kopii trzymać).

### Co robi `run.sh` przy każdym starcie

1. **Build** (`build.py` → `dist/astromeow.html`). Jeśli build się wywali, **działająca instancja nie jest ruszana**.
2. Zatrzymuje poprzednią instancję (pidfile `counter/data/server.pid`), więc spokojnie odpalasz go wielokrotnie.
3. **Kopia bazy** do `counter/data/backups/` (10 ostatnich).
4. Startuje serwer. Jeśli padnie, nadzorca podnosi go po 1 s (po 5 szybkich upadkach z rzędu się poddaje).
5. **Nie dotyka danych.** Baza jest zwykłym plikiem i przeżywa każdy restart.

### Jak to liczy

1. Gra (`js/22-counter.js`) przy starcie robi `POST /api/hit?src=…` (błąd licznika nigdy nie psuje gry).
2. Serwer czyta cookie `vid`. Brak lub błędne → generuje UUID i ustawia cookie na rok.
3. Zapis w bazie: nowy ID = nowy wiersz, znany ID = `hits + 1`. Boty i podglądy linków (po User-Agent) są pomijane.

**Unikalny = jedna przeglądarka**, nie jedna osoba (tryb prywatny albo drugi telefon policzą się osobno).
Na slajdzie mów „unikalne urządzenia/przeglądarki”.

### Baza danych (SQLite)

Nie ma żadnego serwera bazy: to plik `counter/data/counter.db` (obok `-wal` i `-shm`, to normalne, nie kasuj ich
przy działającym serwerze). Tworzy się sam przy pierwszym starcie, jest w `.gitignore`.

```sql
CREATE TABLE visits (
  id         TEXT PRIMARY KEY,      -- cookie vid
  first_seen INTEGER NOT NULL,      -- unix time pierwszego wejścia
  last_seen  INTEGER NOT NULL,      -- unix time ostatniego
  hits       INTEGER NOT NULL DEFAULT 1,
  src        TEXT NOT NULL DEFAULT ''   -- ?src= z QR
);
```

Własne zapytania (wymaga `sqlite3`: `sudo apt install sqlite3`; bez niego wystarczy `counter.sh stats` i `export`):

```bash
sqlite3 counter/data/counter.db "SELECT COUNT(*) FROM visits;"
# wejścia na godzinę
sqlite3 counter/data/counter.db "SELECT strftime('%H:00', first_seen,'unixepoch','localtime') h, COUNT(*) FROM visits GROUP BY h;"
# kto wraca (więcej niż jedno uruchomienie)
sqlite3 counter/data/counter.db "SELECT COUNT(*) FROM visits WHERE hits > 1;"
# który QR działa najlepiej
sqlite3 counter/data/counter.db "SELECT src, COUNT(*) FROM visits GROUP BY src ORDER BY 2 DESC;"
```

### Co jest publiczne przez tunel

Tylko to, co serwer świadomie wystawia: `/` (gra), `/api/hit`, `/api/stats` i `/live` (licznik widoczny dla każdego,
kto zna adres) oraz `/healthz`. Baza, skrypty i `.git` są niedostępne.

### Lista kontrolna przed wejściem na scenę

- [ ] Tunel działa w osobnym terminalu/tmux, adres zapisany, QR z `?src=scena`
- [ ] `bash counter/counter.sh test` → „WSZYSTKO OK”
- [ ] `bash counter/counter.sh reset` (zero po próbach), potem `bash run.sh -d`
- [ ] Zeskanuj QR własnym telefonem: w `/live` liczba rośnie o 1
- [ ] Zeskanuj drugi raz tym samym telefonem: liczba **nie** rośnie (uruchomienia tak)
- [ ] `/live` otwarte na drugim ekranie, laptop na zasilaniu i bez usypiania
- [ ] Sieć na sali: hotspot z telefonu jako plan B

### Ograniczenia

- Serwer musi działać na laptopie/serwerze przez cały pokaz. Zamknięcie laptopa = koniec gry dla nowych osób.
- Wspólne Wi-Fi nie szkodzi (liczymy po cookie, nie po IP).
- Cloudflare Web Analytics możesz włączyć równolegle jako drugie, niezależne źródło (opóźnione).
- Przy ewentualnym przejściu na Cloudflare Pages logika zostaje ta sama (Pages Functions + D1, ten sam schemat).

## Wygląd i Astruś (główny bohater)
Kot nazywa się **Astruś** i to on prowadzi gracza: wita, komentuje odpowiedzi w quizie, tłumaczy tutoriale i podpowiada w bazie (`catSay()` = Astruś + dymek). Nazwa aplikacji zostaje „AstroMeow”.

### Paleta (jasna, ograniczona; `css/01-base.css`, `:root`)
| Zmienna | Hex | Użycie |
|---|---|---|
| `--bg` | `#FFF8F0` | tło aplikacji (ciepły krem) |
| `--surface` | `#FFFFFF` | karty, okna, odpowiedzi |
| `--ink` | `#1B1446` | tekst i obrysy (granat kombinezonu) |
| `--orange` | `#F28A1E` | kolor główny, jedna następna akcja (przycisk `b-lav`, aktywna zakładka) |
| `--oranged` | `#A85200` | ciemny pomarańcz: małe napisy i cienie na jasnym tle |
| `--orange-soft` | `#FFEBD2` | tint pomarańczu: zaznaczenie, kafelki, tło planety |
| `--muted` | `#645F7E` | tekst pomocniczy |
| `--grey` | `#E8E1D6` | neutralna szarość: tory, zablokowane, wyłączone |
| `--ok` / `--ok-soft` | `#167A45` / `#DDF4E6` | **tylko** dobra odpowiedź |
| `--bad` / `--bad-soft` | `#C62E2E` / `#FBDEDE` | **tylko** zła odpowiedź |

Zasady: na ekranie jest **jeden** pomarańczowy przycisk (następny krok), reszta to białe przyciski z obrysem (`b-white`) albo linki (`.link`). Zielony i czerwony nie występują nigdzie poza feedbackiem poprawne/błędne. Nowe kolory dodawaj tylko w `:root`.
- Przyciski i karty mają gruby ciemny obrys i twardy cień. Konfetti (`confetti()`) to małe kawałki w kolorach palety.
- Kot: `cat/idle.webp` oraz `happy/sad/think/cheer.webp` (nie zmieniać). `build.py` wbudowuje je w `dist/astromeow.html`, więc plik działa sam.
- `cat(poza, rozmiar)` rysuje Astrusia, `catSay(poza, html)` daje „Astruś + dymek”: używaj do tłumaczenia czegokolwiek (quiz, gierki, tutorial). `confirmSheet({...})` to okno potwierdzenia z Astrusiem.
- Dolne menu (`#nav` w `index.html`) mieści do 6 zakładek (dodaj kolejny `<button data-act="tab" data-arg="...">` i wpis w `setTab()` w `js/20-router.js`).

## Ciekawostki
Treść ekranu Ciekawostki (kategorie: Ignis, Polacy w kosmosie, POLSA, ESA, NASA) leży w `config/ciekawostki.json`. Żeby dodać ciekawostkę, dopisz obiekt (`id` unikalny, `title`, `text`, opcjonalnie `astrus` i `source`) do `facts` wybranej kategorii; kod nie wymaga zmian. Pierwsza kategoria na liście jest wyróżniona. Ekran czyta `DATA.ciekawostki` (loader z `js/00-data.js`), a przeczytane ciekawostki zapisuje w `P.facts`.

### Profile i ranking

Uruchom grę przez `python3 build.py` i `python3 counter/server.py serve`.
Serwer trzyma nicki, głos, sesje i rekordy minigier w istniejącym pliku SQLite.
Skopiowany samodzielny HTML działa offline z lokalnym profilem. Ranking wymaga tego serwera.
Listy blokowanych nazw są w `config/blocked-words.pl.txt` oraz `config/blocked-words.en.txt`.
