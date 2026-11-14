# AstroMeow

Gra edukacyjna o kosmosie dla dzieci 7–12 lat (NASA Space Apps Stalowa Wola 2026).

## Uruchomienie
- Lokalnie: otwórz `index.html` w przeglądarce.
- Szybki hosting cloudflared:
```bash
python3 build.py
cloudflared tunnel --url http://localhost:8085
python3 -m http.server 8085 --bind 127.0.0.1
```

## Struktura
```
index.html          szkielet strony (ładuje pliki w kolejności)
css/                style, w kolejności ładowania
  01-base           paleta, nawigacja, przyciski, karty
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
  05-questions      MISJE I PYTANIA (tu dopisujesz treść)
  06-base-data      planety, budynki, dodatki
  07-state          stan gry, zapis, ekonomia bazy
  08-ui, 09-start, 10-home, 11-trail   ekrany: start, menu, szlak misji
  12-quiz           quiz, serca, złote życie
  13-minigames, 14-pack   gierki (canvas) i układanie rakiety
  15-results        wynik gierki / raport misji
  16-base, 17-shop, 18-tutorial, 19-badges   baza, sklep, tutoriale, odznaki
  20-router, 21-start-loop   akcje kliknięć i start aplikacji
cat/                (opcjonalnie) klatki kota: idle_1.png … cheer_3.png albo idle.gif …
```

## Typowe zmiany
- Nowe pytania / misje: `js/05-questions.js` (tablica `MISSIONS`).
- Progi odblokowania planet i ich mnożniki: `js/06-base-data.js` (`PLANETS`).
- Skiny i ceny: `js/03-cat.js` (`SKINS`), cena złotego życia: `GOLD_PRICE`.
- Kolory: `css/01-base.css` (zmienne `--lav`, `--mint`…).
