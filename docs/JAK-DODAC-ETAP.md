# Jak dodać etap, pytania i lekcję (bez programowania)

Misje i pytania są w **`config/missions.json`**, a lekcje w **`config/tutorials.json`**. Nie musisz ruszać żadnego kodu.
Nowy etap pojawi się sam na szlaku misji, w odznakach i w quizie.

## Jak to jest zbudowane

```
config/missions.json
├── difficulties   poziomy trudności (Łatwy, Średni, Trudny), zwykle nie zmieniasz
└── stages         lista etapów, tu dopisujesz nowe
    └── etap
        ├── id, title, icon, topic   numer, nazwa, ikona na mapie, ikona tematu
        └── questions                PYTANIA
            └── easy / mid / hard    lista pytań na każdy poziom
```

- **Pytanie**: `{"q": "treść", "a": "poprawna", "w": ["zła 1", "zła 2", "zła 3"], "f": "ciekawostka (opcjonalna)"}`
  - `a` to dokładnie jedna dobra odpowiedź, `w` to dokładnie **trzy** złe. Gra sama miesza kolejność.
  - `f` Astruś przeczyta po odpowiedzi. Możesz ją pominąć.
- **Karta lekcji**: `{"icon": "🚀", "title": "Krótki tytuł", "text": "Dwa, trzy proste zdania."}`
- W misji jest 5 pytań losowanych z puli. Daj **co najmniej 5 pytań na poziom** (im więcej, tym mniej powtórek).
  Gdy dasz mniej, gra użyje tylu, ile jest.
- Lekcję pokazujemy automatycznie raz (dla danego poziomu), potem jest link „📖 Lekcja” na ekranie startu misji.
  W `config/tutorials.json` dodaj kartę pod `lessons`, używając identyfikatora misji jako klucza. Wartością może być lista wspólnych kart albo obiekt z listami `easy/mid/hard`.

## Jak dodać nowy etap (krok po kroku)

1. Otwórz `config/missions.json` w dowolnym edytorze (np. VS Code, Notatnik).
2. Przewiń na sam dół listy `stages`, do końca ostatniego etapu (nawias `}`).
3. Po ostatnim `}` wstaw **przecinek**, a potem wklej cały blok z przykładu niżej.
4. Zmień `id` na kolejny numer (nie powtarzaj istniejących, **nie zmieniaj** numerów starych etapów, bo ich
   zapisane postępy graczy by się pomieszały), uzupełnij pytania i lekcję.
5. Uruchom w folderze gry: `python3 build.py`. Jeśli coś jest źle, dostaniesz po polsku listę błędów
   (np. „etap 7, poziom easy, pytanie 2: `w` to lista dokładnie 3 złych odpowiedzi, a jest 2”).
   Dopiero komunikat `OK ->` oznacza, że wszystko gra.
6. Otwórz `dist/astromeow.html` (albo `bash run.sh`) i sprawdź etap na szlaku misji.

Uwagi: JSON jest wymagający. Teksty w **podwójnych** cudzysłowach `"..."`, elementy listy oddzielone przecinkami,
**po ostatnim elemencie nie ma przecinka**. Cudzysłów w środku tekstu pisz jako `„tak”` albo `\"tak\"`.

## Przykład: gotowy blok do wklejenia (etap 7)

```json
,
    {
      "id": 7, "title": "MeowMission 7: Gwiazdy", "icon": "⭐", "topic": "🌟",
      "questions": {
        "easy": [
          {"q": "Co to jest Słońce?", "a": "Gwiazda", "w": ["Planeta", "Księżyc", "Kometa"]},
          {"q": "Dlaczego gwiazdy wyglądają na małe?", "a": "Są bardzo daleko", "w": ["Są z papieru", "Są małe jak monety", "Chowają się za chmurami"]},
          {"q": "Kiedy widać gwiazdy?", "a": "W nocy", "w": ["Tylko w południe", "Tylko w zimie", "Nigdy"]},
          {"q": "Czy Słońce jest gwiazdą?", "a": "Tak", "w": ["Nie, to planeta", "Nie, to księżyc", "Nie, to kometa"]},
          {"q": "Z czego jest gwiazda?", "a": "Z gorącego gazu", "w": ["Z lodu", "Z drewna", "Z waty"]}
        ],
        "mid": [
          {"q": "Co to jest gwiazdozbiór?", "a": "Obrazek ułożony z gwiazd", "w": ["Kosmiczny statek", "Rodzaj planety", "Zbiornik na paliwo"], "f": "Jednym z nich jest Wielki Wóz."},
          {"q": "Co pokazuje Gwiazda Polarna?", "a": "Północ", "w": ["Południe", "Godzinę", "Pogodę"]},
          {"q": "Która gwiazda jest najbliżej Ziemi?", "a": "Słońce", "w": ["Syriusz", "Gwiazda Polarna", "Wega"]},
          {"q": "Dlaczego gwiazdy migoczą?", "a": "Bo ich światło przechodzi przez atmosferę", "w": ["Bo mrugają", "Bo się boją", "Bo ktoś je włącza"]},
          {"q": "Ile gwiazd widać gołym okiem w nocy?", "a": "Kilka tysięcy", "w": ["Dwie", "Dokładnie sto", "Miliard"]}
        ],
        "hard": [
          {"q": "Co mierzy rok świetlny?", "a": "Odległość", "w": ["Czas", "Jasność", "Temperaturę"]},
          {"q": "Jak nazywa się wybuch umierającej gwiazdy?", "a": "Supernowa", "w": ["Kometa", "Zaćmienie", "Zorza"]},
          {"q": "Gdzie rodzą się gwiazdy?", "a": "W chmurach gazu i pyłu", "w": ["W oceanach", "W kraterach", "W atmosferze Ziemi"]},
          {"q": "Jak nazywa się nasza galaktyka?", "a": "Droga Mleczna", "w": ["Wielki Wóz", "Orion", "Andromeda"]},
          {"q": "Jaka jest najbliższa gwiazda poza Słońcem?", "a": "Proxima Centauri", "w": ["Syriusz", "Gwiazda Polarna", "Betelgeza"]}
        ]
      }
    }
```

(Przykład jest tylko wzorem. Tego etapu nie ma w grze, dopóki go sam nie wkleisz.)

## Inne rzeczy w folderze `config/`

- `config/ciekawostki.json`: ekran „Ciekawostki”.
