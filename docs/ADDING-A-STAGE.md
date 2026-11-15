# How to add a stage, questions and a lesson (no programming)

Missions and questions live in **`config/missions.json`**, lessons in **`config/tutorials.json`**. You do not have to touch any code.
A new stage appears on its own on the mission trail, in the badges and in the quiz.

The game content is in Polish, so the questions, answers and lessons you write are Polish too. The examples below are Polish for that reason; the explanations are in English.

## How it is built

```
config/missions.json
├── difficulties   difficulty levels (Easy, Medium, Hard), you usually leave them alone
└── stages         the list of stages, add new ones here
    └── stage
        ├── id, title, icon, topic   number, name, icon on the map, topic icon
        └── questions                QUESTIONS
            └── easy / mid / hard    a list of questions for each level
```

- **Question**: `{"q": "text", "a": "correct", "w": ["wrong 1", "wrong 2", "wrong 3"], "f": "fun fact (optional)"}`
  - `a` is exactly one correct answer, `w` is exactly **three** wrong ones. The game shuffles the order itself.
  - `f` is read out by Astruś after the answer. You can leave it out.
- **Lesson card**: `{"icon": "🚀", "title": "Short title", "text": "Two or three simple sentences."}`
- A mission draws 5 questions from the pool. Give **at least 5 questions per level** (the more, the fewer repeats).
  If you give fewer, the game uses as many as there are.
- A lesson is shown automatically once (per level), after that there is a "📖 Lekcja" (Lesson) link on the mission start screen.
  In `config/tutorials.json` add a card under `lessons`, using the mission id as the key. The value can be a list of shared cards or an object with `easy/mid/hard` lists.

## How to add a new stage (step by step)

1. Open `config/missions.json` in any editor (e.g. VS Code, Notepad).
2. Scroll to the very bottom of the `stages` list, to the end of the last stage (the `}` bracket).
3. After the last `}` insert a **comma**, then paste the whole block from the example below.
4. Change `id` to the next number (do not repeat existing ones, **do not change** the numbers of old stages, because the
   players' saved progress would get mixed up), then fill in the questions and the lesson.
5. Run in the game folder: `python3 build.py`. If something is wrong, you get a list of errors (in Polish),
   for example "etap 7, poziom easy, pytanie 2: `w` to lista dokładnie 3 złych odpowiedzi, a jest 2"
   (stage 7, level easy, question 2: `w` must be a list of exactly 3 wrong answers, but there are 2).
   Only the message `OK ->` means everything is fine.
6. Open `dist/astromeow.html` (or `bash run.sh`) and check the stage on the mission trail.

Notes: JSON is strict. Texts go in **double** quotes `"..."`, list items are separated by commas,
there is **no comma after the last item**. Write a quote inside a text as `„tak”` or `\"tak\"`.

## Example: a ready block to paste (stage 7)

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

(The example is only a template. This stage does not exist in the game until you paste it in yourself.)

## Other things in the `config/` folder

- `config/ciekawostki.json`: the Facts ("Ciekawostki") screen.
