'use strict';
/* =====================================================================
   AstroMeow · szlak MeowMission · sklep ze skinami · złote życie · quiz (3 serca) + gierki + baza
   ---------------------------------------------------------------------
   KOT (animowany buddy): wrzuć pliki do folderu  cat/  obok tego pliku:
     cat/idle_1.png idle_2.png idle_3.png   (3 klatki na pozę)
     … tak samo dla: happy, sad, think, cheer
   Albo pojedynczy GIF:  cat/idle.gif  cat/happy.gif  …
   Brakujące pozy: używana jest poza idle, a bez żadnych plików rysuje się
   zastępczy kotek SVG. Zero zmian w kodzie.
   ===================================================================== */
const CAT_DIR  = 'cat/';
const SAVE_KEY = 'astromeow-v1';

const $ = s => document.querySelector(s);
const device = $('#device'), app = $('#app'), nav = $('#nav');
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
