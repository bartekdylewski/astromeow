'use strict';
/* ===================== BAZA: dane ===================== */
/* planety/kolonie: rozmiar siatki, ile misji trzeba zaliczyć, mnożnik kosztów (cm) i zysków (pm) */
const PLANETS = [
  { id: 'ksiezyc1', name: 'Księżyc: Biegun Południowy', icon: '🌙', n: 2, need: 0,  cm: 1,  pm: 1,   bg: '#E4E8F3' },
  { id: 'mars',     name: 'Mars: Jezero',               icon: '🔴', n: 3, need: 3,  cm: 2,  pm: 3,   bg: '#FFD9C2' },
  { id: 'merkury',  name: 'Merkury: Basen Caloris',     icon: '⚫', n: 3, need: 7,  cm: 4,  pm: 7,   bg: '#E3DAD0' },
  { id: 'ksiezyc2', name: 'Księżyc: Morze Spokoju',     icon: '🌗', n: 4, need: 11, cm: 9,  pm: 16,  bg: '#D9DFEE' },
  { id: 'mars2',    name: 'Mars: Valles Marineris',     icon: '🔴', n: 5, need: 15, cm: 20, pm: 40,  bg: '#F3C9AE' },
  { id: 'merkury2', name: 'Merkury: Biegun Północny',   icon: '⚫', n: 5, need: 18, cm: 45, pm: 100, bg: '#D5CCC4' },
];
const misPl = n => n === 1 ? 'misję' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'misje' : 'misji';
const RES = {
  wiedza: { icon: '🫁', name: 'Tlen' },
  czesci: { icon: '⚡', name: 'Energia' },
  meteo:  { icon: '💧', name: 'Woda' },
};
const TYPES = {
  warsztat: { icon: '🔋', name: 'Elektrownia',  desc: 'Daje energię dla bazy.',          req: 0, base: { wiedza: 15 }, prod: { czesci: 1 }, max: 5 },
  lab:      { icon: '🪴', name: 'Szklarnia',    desc: 'Rośliny produkują tlen.',          req: 1, base: { czesci: 30 }, prod: { wiedza: 0.5 }, max: 5 },
  lowca:    { icon: '☄️', name: 'Łowca lodu',   desc: 'Zbiera lód wodny z meteorytów.',   req: 2, base: { czesci: 60, wiedza: 20 }, prod: { meteo: 0.2 }, max: 5 },
  satelita: { icon: '🛰️', name: 'Satelita',     desc: 'Wzmacnia wszystkie budynki.',      req: 3, base: { meteo: 25 }, prod: {}, max: 5, aura: 0.15 },
  hangar:   { icon: '🚀', name: 'Hangar',       desc: 'Rakiety wożą energię i wodę.',     req: 4, base: { czesci: 200, meteo: 40 }, prod: { czesci: 1, meteo: 0.1 }, max: 5 },
};
const ADDONS = {
  panel:  { icon: '☀️', name: 'Panele',  mult: 0.25, cost: { czesci: 20 } },
  antena: { icon: '📡', name: 'Antena',  mult: 0.25, cost: { wiedza: 30 } },
  kopula: { icon: '🛡️', name: 'Osłona',  mult: 0.40, cost: { meteo: 15 } },
};
const DECOR = ['🪨', '✨', '⭐', '🪐', '🌑'];
