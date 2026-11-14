'use strict';
/* ===================== BAZA: dane ===================== */
/* planety/kolonie: rozmiar siatki, ile misji trzeba zaliczyć, mnożnik kosztów (cm) i zysków (pm) */
const PLANETS = [
  { id: 'alfa',   name: 'Księżyc Alfa', icon: '🌙', n: 2, need: 0, cm: 1,  pm: 1 },
  { id: 'mars',   name: 'Mars Beta',    icon: '🔴', n: 3, need: 6, cm: 3,  pm: 4 },
  { id: 'europa', name: 'Europa Gamma', icon: '🧊', n: 4, need: 14, cm: 9,  pm: 14 },
  { id: 'tytan',  name: 'Tytan Delta',  icon: '🪐', n: 5, need: 18, cm: 27, pm: 50 },
];
const misPl = n => n === 1 ? 'misję' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'misje' : 'misji';
const RES = {
  wiedza: { icon: '🧠', name: 'Wiedza' },
  czesci: { icon: '🔩', name: 'Części' },
  meteo:  { icon: '☄️', name: 'Meteoryty' },
};
const TYPES = {
  warsztat: { icon: '🔧', name: 'Warsztat',     req: 0, base: { wiedza: 15 }, prod: { czesci: 1 }, max: 5 },
  lab:      { icon: '🧪', name: 'Laboratorium', req: 1, base: { czesci: 30 }, prod: { wiedza: 0.5 }, max: 5 },
  lowca:    { icon: '☄️', name: 'Łowca',        req: 2, base: { czesci: 60, wiedza: 20 }, prod: { meteo: 0.2 }, max: 5 },
  satelita: { icon: '🛰️', name: 'Satelita',     req: 3, base: { meteo: 25 }, prod: {}, max: 5, aura: 0.15 },
  hangar:   { icon: '🚀', name: 'Hangar',       req: 4, base: { czesci: 200, meteo: 40 }, prod: { czesci: 1, meteo: 0.1 }, max: 5 },
};
const ADDONS = {
  panel:  { icon: '☀️', name: 'Panele', mult: 0.25, cost: { czesci: 20 } },
  antena: { icon: '📡', name: 'Antena', mult: 0.25, cost: { wiedza: 30 } },
  kopula: { icon: '🫧', name: 'Kopuła', mult: 0.40, cost: { meteo: 15 } },
};
const DECOR = ['🪨', '✨', '⭐', '🪐', '🌑'];
