'use strict';
/* ===================== ROUTER + AKCJE ===================== */
function setTab(t) {
  closeSheet();
  ({ home: renderHome, map: renderMap, base: renderBase, shop: renderShop, badges: renderBadges, facts: renderFacts })[t]();
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-ans],[data-act]'); if (!el || el.disabled) return;
  if (el.dataset.ans !== undefined) return answer(+el.dataset.ans);
  const a = el.dataset.act, arg = el.dataset.arg;
  switch (a) {
    case 'diff':        P.diff = arg; P.startIdx = Math.max(P.startIdx, TIERS.indexOf(arg)); save(); return renderHome();
    case 'profile':      return renderProfile();
    case 'profile-back': return setTab(profileTab);
    case 'profile-badges': return renderBadges();
    case 'changediff':  return renderStart();
    case 'tab':         return setTab(arg);
    case 'fact-cat':    FACT = { cat: arg, i: 0 }; return renderFact();
    case 'fact-next':   FACT.i++; return renderFact();
    case 'fact-prev':   FACT.i--; return renderFact();
    case 'fact-list':   return renderFacts();
    case 'start-next': { useGold = P.golden > 0; const t = nextTarget(); if (t.promote) { P.diff = t.tier; save(); confetti(24); toast('🎉 Awans! Poziom: ' + DIFFS[t.tier].name); } return renderIntro(t.m); }
    case 'node': { const [t, id] = arg.split(':'), m = MISSIONS.find(x => x.id == id); if (!nodeOpen(t, m)) return toast('🔒 Najpierw zalicz poprzednią misję', false); P.diff = t; useGold = P.golden > 0; save(); return renderIntro(m, 'map'); }
    case 'goplanet': { const i = +arg; if (!pOpen(i)) return toast('🔒 ' + PLANETS[i].name + ': ' + pReason(i), false); P.planet = i; P.seenPlanets = Math.max(P.seenPlanets, i + 1); save(); closeSheet(); return setTab('base'); }
    case 'togold':      useGold = !useGold; return cur();
    case 'buygold':     if (P.pts < GOLD_PRICE) return toast('Za mało ⭐. Zalicz misję!', false); P.pts -= GOLD_PRICE; P.golden++; save(); confetti(10); toast('💛 Kupiono złote życie!'); return renderShop();
    case 'buyskin': { const sk = SKINS.find(x => x.id === arg); if (P.pts < sk.p) return toast('Za mało ⭐. Zalicz misję!', false); P.pts -= sk.p; P.skins.push(sk.id); P.skin = sk.id; save(); confetti(18); toast('🎉 Nowy skin: ' + sk.n); return renderShop(); }
    case 'equip':       P.skin = arg; save(); return renderShop();
    case 'sheet-close': return closeSheet();
    case 'welcome-next': { const i = +arg; if (i < WELCOME.length - 1) return renderWelcome(i + 1); P.tut.welcome = true; P.diff = 'easy'; P.startIdx = 0; save(); useGold = false; return startMission(1); }
    case 'quit-quiz':   return confirmSheet({ pose: 'sad', title: 'Wyjść z misji?', text: 'Postęp w tej misji przepadnie, ale zaliczone wcześniej zostają.', yes: 'WYJDŹ NA SZLAK', yesAct: 'quit-yes' });
    case 'quit-yes':    closeSheet(); return P.runs ? renderMap() : renderHome();
    case 'tut':         return openTut(arg);
    case 'tut-next':    if (TUT && TUT.i < DATA.tutorials[TUT.k].length - 1) { TUT.i++; return renderTut(); } return closeTut();
    case 'tut-skip':    return closeTut();
    case 'start-mission': return beginMission(+arg);
    case 'lesson':      return lessonStep(arg);
    case 'lesson-end':  return lessonEnd(arg);
    case 'retry':       return startMission(S.m.id);
    case 'check':       return check();
    case 'cont':        return cont();
    case 'play':        return playGame(arg);
    case 'retry-game':  mapMsg = ''; return renderGameIntro(GSET.key);
    case 'skipgame':    stopGame(); return renderMap();
    case 'quitgame':    stopGame(); return renderMap();
    case 'tile': { const [x, y] = arg.split(',').map(Number), t = tileAt(x, y); if (!t) openBuildMenu(x, y); else openBuilding(x, y); return; }
    case 'place':       return placeBuilding(arg);
    case 'upgrade':     return upgradeBuilding();
    case 'slot':        return openAddonPicker();
    case 'addon':       return addAddon(arg);
  }
});
