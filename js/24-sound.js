'use strict';
/* ===================== DŹWIĘKI: Web Audio, bez plików, bez muzyki ===================== */
/* sfx('click'|'ok'|'no'|'win'|'lose'|'meow'); wyciszenie: sfxToggle(), klucz localStorage 'astromeow-sound' ('0'/'1') */
(function () {
  const KEY = 'astromeow-sound';
  let ctx = null, master = null, on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (_) {}

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();       // limiter: nigdy nie przesterowuje
      master = ctx.createGain(); master.gain.value = .5;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  /* jedna nuta: obwiednia ADSR-lite, opcjonalny glide */
  function tone(c, out, { f, f2, t = 0, d = .15, type = 'sine', v = .3, a = .008 }) {
    const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + d + .03);
  }
  const notes = (c, out, fs, step, o) => fs.forEach((f, i) => tone(c, out, Object.assign({ f, t: i * step }, o)));

  function meow(c, out) {
    const t0 = c.currentTime, dur = .46, base = 1 + (Math.random() - .5) * .22;
    const src = c.createOscillator(); src.type = 'sawtooth';
    const p = src.frequency;                              // "mi-a-u": w górę, a potem w dół
    p.setValueAtTime(380 * base, t0);
    p.exponentialRampToValueAtTime(820 * base, t0 + .13);
    p.setValueAtTime(820 * base, t0 + .17);
    p.exponentialRampToValueAtTime(430 * base, t0 + dur);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 7; lg.gain.value = 14;   // delikatne vibrato
    lfo.connect(lg); lg.connect(p);
    /* formanty samogłosek: "i" (wysoko) -> "a" -> "u" (nisko) */
    const mix = c.createGain(), env = c.createGain();
    [0, 1].forEach(k => {
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 5;
      bp.frequency.setValueAtTime(k ? 700 : 2400, t0);
      bp.frequency.linearRampToValueAtTime(k ? 1200 : 1500, t0 + .2);
      bp.frequency.linearRampToValueAtTime(k ? 450 : 700, t0 + dur);
      const bg = c.createGain(); bg.gain.value = k ? .9 : .6;
      src.connect(bp); bp.connect(bg); bg.connect(mix);
    });
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
    mix.connect(lp); lp.connect(env); env.connect(out);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(.9, t0 + .05);
    env.gain.setValueAtTime(.9, t0 + .22);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.start(t0); lfo.start(t0); src.stop(t0 + dur + .03); lfo.stop(t0 + dur + .03);
  }

  const SOUNDS = {
    click: (c, o) => tone(c, o, { f: 900, f2: 520, d: .05, type: 'triangle', v: .09, a: .003 }),
    ok:    (c, o) => notes(c, o, [660, 880, 1318], .075, { d: .22, type: 'triangle', v: .22 }),
    no:    (c, o) => tone(c, o, { f: 220, f2: 130, d: .32, type: 'sine', v: .35, a: .02 }),
    win:   (c, o) => { notes(c, o, [523, 659, 784, 1047], .12, { d: .3, type: 'triangle', v: .22 }); notes(c, o, [1047], 0, { t: .36, d: .5, type: 'sine', v: .12 }); },
    lose:  (c, o) => notes(c, o, [440, 392, 330], .17, { d: .3, type: 'sine', v: .24 }),
    meow,
  };
  window.sfx = function (name) {
    if (!on || !SOUNDS[name]) return;
    try { const c = ensure(); if (c) SOUNDS[name](c, master); } catch (_) {}
  };
  window.sfxToggle = function () {
    on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (_) {}
    paintBtn(); if (on) sfx('click'); return on;
  };
  /* samotest bez głośników: buduje wszystkie dźwięki na OfflineAudioContext */
  window.sfxSelfTest = async function () {
    const oc = new OfflineAudioContext(1, 44100, 44100), g = oc.createGain(); g.connect(oc.destination);
    Object.keys(SOUNDS).forEach(k => SOUNDS[k](oc, g));
    const buf = await oc.startRendering(), d = buf.getChannelData(0); let peak = 0;
    for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    return peak;
  };

  /* ---- kliknięcia przycisków ---- */
  const CLICKABLE = '.btn,.ans,.x,.link,.pcard,#nav button,[data-act],[data-ans],.tile,.snd';
  document.addEventListener('pointerdown', e => {
    ensure();                                             // pierwszy gest odblokowuje audio
    const t = e.target.closest && e.target.closest(CLICKABLE);
    if (t && !t.disabled && !t.closest('.cat')) sfx('click');
  }, true);

  /* ---- Astruś: dotyk = miau + ruch + dymek ---- */
  const LINES = ['Miau!', 'Mrrau!', 'Miau miau!'], TALK = ['Lubię Cię! 🧡', 'Kosmos jest super!', 'Mruuu~', 'Lecimy dalej?'];
  let last = 0, taps = 0;
  function tapCat(cat) {
    const now = Date.now(); if (now - last < 350) return; last = now; taps++;
    sfx('meow');
    cat.classList.remove('meow'); void cat.offsetWidth; cat.classList.add('meow');
    cat.addEventListener('animationend', function h(ev) { if (!ev.animationName.startsWith('meow')) return; cat.classList.remove('meow'); cat.removeEventListener('animationend', h); });
    cat.querySelectorAll('.mpop').forEach(n => n.remove());
    const p = document.createElement('span'); p.className = 'mpop';
    p.textContent = taps % 5 === 0 ? TALK[Math.floor(Math.random() * TALK.length)] : LINES[Math.floor(Math.random() * LINES.length)];
    cat.appendChild(p); setTimeout(() => p.remove(), 1000);
  }
  document.addEventListener('click', e => {
    const c = e.target.closest && e.target.closest('.cat');
    if (c && !c.closest('canvas')) tapCat(c);
  }, true);
  /* dostępność: kot jako przycisk (bez zmian w cat()) */
  function a11y(root) {
    root.querySelectorAll('.cat:not([role])').forEach(c => { c.setAttribute('role', 'button'); c.setAttribute('aria-label', 'Pogłaszcz Astrusia'); c.tabIndex = 0; });
  }
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('cat')) { e.preventDefault(); tapCat(e.target); }
  });

  /* ---- przycisk wyciszenia: tylko na ekranie głównym ---- */
  let btn = null;
  function paintBtn() { if (btn) { btn.textContent = on ? '🔊' : '🔇'; btn.setAttribute('aria-label', on ? 'Wycisz dźwięki' : 'Włącz dźwięki'); } }
  function sync() {
    const app = document.getElementById('app'); if (!app) return;
    a11y(app);
    const home = !!app.querySelector('h1.logo.sm');
    if (home && !btn) {
      btn = document.createElement('button'); btn.className = 'snd'; btn.type = 'button';
      btn.addEventListener('click', () => sfxToggle());
      (document.getElementById('device') || document.body).appendChild(btn); paintBtn();
    }
    if (btn) btn.hidden = !home;
  }
  function init() {
    const app = document.getElementById('app'); if (!app) return;
    new MutationObserver(sync).observe(app, { childList: true, subtree: true });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
