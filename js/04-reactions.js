'use strict';
/* ===================== BRAINROT (kid-safe, krótkie, pozytywne) ===================== */
const BR = {
  start: ['Dasz radę! 💪', 'Tryb sigma ON 🗿', 'Skup się, kadecie 🎯', 'Lecimy z tym 🚀', 'Słuchaj uważnie 👀', 'No to jedziemy ✨'],
  good: ['W! 🔥 Slay 💅', 'No cap, mega mózg 🧠', 'Rizz level: MAX 😤', 'Sigma moment 🗿', 'Aura +1000 ✨', 'Ez. Nawet się nie spociłeś 😎', 'Skibidi dobra robota 🕺', 'Lowkey geniusz 🧠', 'Giga W, kadecie! 🏆', 'Mega ogarnięty, bez kitu 🤌', 'Kosmiczny mózg ✨🧠', 'Chat, to jest W 🏆'],
  combo: ['COMBO x3! 🔥 Aura +9999', 'Nie do zatrzymania! 🚀 Streak!', 'Astruś w szoku 😮 Jesteś cooked… ale dla pytań 😎', 'Sigma grindset 🗿🔥 dalej!', 'Pełen rizz, zero błędów 😤'],
  bad: ['L… ale tylko na chwilę 💀 Wracasz silniejszy', 'Bruh… trening czyni mistrza 💪', 'Skill issue? Nie, to rozgrzewka 😅', 'Aura -10, ale odbijesz się 🗿', 'Oof. Kosmos jest trudny, serio 🌌', 'Glitch w matriksie 🤖 Próbuj dalej', 'Sus odpowiedź 👀 ale nic się nie stało', 'Spoko, nawet astronauci mylą przyciski 🙈', 'Plot twist: podchwytliwe 🌀'],
  last: ['Ostatnie serce! Focus mode 🎯', 'Last life, tryb sigma 🗿', 'Ostatnie serduszko, ale Astruś w Ciebie wierzy 🥹'],
  dead: ['Koniec serc… ale Astruś w Ciebie wierzy 🥹', 'L… ale każdy zaczyna od zera 💀➡️🔥', 'Spokojnie, kosmos poczeka 🌌'],
  win: ['Misja zaliczona! W! 🏆', 'Slay! Astruś jest dumny 💅', 'Aura +9999 ✨ Misja zaliczona!', 'Giga W, kadecie! 🚀'],
  gameHigh: ['Rekord vibes 🔥', 'Pro gamer z kosmosu 🎮', 'Skibidi wynik! 🕺'],
  gameLow: ['Następnym razem będzie W 💪', 'Ledwo rozgrzewka 😅', 'Gierka sus, ale próbuj jeszcze 👀'],
};
let lastLine = '';
function say(pool) { let l, n = 0; do { l = pick(pool); n++; } while (l === lastLine && pool.length > 1 && n < 6); lastLine = l; return l; }
