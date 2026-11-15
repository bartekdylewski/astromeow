'use strict';

const PROFILE_KEY = 'astromeow-profile';
let player = { nickname: '', pitch: 0, tag: null };
let profileOnline = false, profileTab = 'home', scoreRun = null;
try { player = { ...player, ...JSON.parse(localStorage.getItem(PROFILE_KEY)) }; } catch (_) {}

function storePlayer() {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(player)); } catch (_) {}
}

async function playerRequest(path, data = {}) {
  const response = await fetch('/api/' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data), signal: AbortSignal.timeout(4000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Serwer jest niedostępny.');
  return result;
}

function setPlayer(profile) {
  player = { ...profile, played: player.played || !profile.firstGame, pending: false };
  storePlayer();
}

async function initPlayer() {
  try {
    const profile = await playerRequest('session');
    profileOnline = true;
    setPlayer(player.pending ? await playerRequest('profile', {
      nickname: player.nickname, pitch: player.pitch,
    }).catch(() => profile) : profile);
  } catch (_) {}
}

function nicknameAllowed(nickname) {
  const normalize = value => value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[01345789ł]/g, c => 'oieastbgl'['01345789ł'.indexOf(c)])
    .replace(/[ _]+/g, ' ').trim();
  const words = normalize(nickname).split(' ');
  return ![...DATA['blocked-words.pl'], ...DATA['blocked-words.en']].some(entry => {
    entry = entry.trim();
    if (!entry) return false;
    const prefix = entry.endsWith('*');
    const blocked = normalize(entry.replace(/\*$/, '')).split(' ');
    return words.some((_, i) => blocked.every((word, j) =>
      prefix && j === blocked.length - 1 ? words[i + j]?.startsWith(word) : words[i + j] === word));
  });
}

function renderProfile(first = false) {
  stopGame();
  cur = () => renderProfile(first);
  show(`<section class="scr profile">
    ${first ? '' : '<button class="x" data-act="profile-back">←</button>'}
    <div class="tc">${cat('happy', 6)}<h1>${first ? 'Jak się nazywasz, kadecie?' : 'Profil gracza'}</h1>
      <p id="profile-tag"></p></div>
    <form id="profile-form" class="card col gap">
      <label for="nickname">Nick</label>
      <input id="nickname" name="nickname" maxlength="32" required autocomplete="nickname">
      <label for="pitch">Głos Astrusia</label>
      <input id="pitch" name="pitch" type="range" min="-12" max="12" step="1" value="${player.pitch}">
      <button class="btn b-white" type="button" id="meow-preview">Odsłuchaj miauczenie</button>
      <button class="btn b-lav" type="submit">Zapisz</button>
      <p id="profile-status" role="status"></p>
    </form>
    ${first ? '' : '<button class="btn b-white mt" data-act="profile-badges">Odznaki</button>'}
  </section>`, { nav: !first, tab: 'profile' });
  const form = $('#profile-form'), nickname = form.elements.nickname, pitch = form.elements.pitch;
  const tag = $('#profile-tag'), status = $('#profile-status');
  nickname.value = player.nickname || '';
  tag.textContent = player.tag ? `${player.nickname}#${player.tag}` : '';
  $('#meow-preview').onclick = () => window.previewMeow?.(+pitch.value);
  form.onsubmit = async event => {
    event.preventDefault();
    const value = nickname.value.trim().normalize('NFC'), chosen = +pitch.value;
    if (![...value].length || [...value].length > 32 || !/^[\p{L}\p{Nd} _]+$/u.test(value)) {
      status.textContent = 'Nick musi mieć 1–32 znaki: litery, cyfry, spacje lub _.'; return;
    }
    if (!nicknameAllowed(value)) { status.textContent = 'Ten nick zawiera niedozwolone słowo.'; return; }
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    try {
      if (profileOnline) setPlayer(await playerRequest('profile', { nickname: value, pitch: chosen }));
      else throw new TypeError('offline');
    } catch (error) {
      if (profileOnline && !(error instanceof TypeError) && error.name !== 'TimeoutError') {
        status.textContent = error.message; return;
      }
      player = { ...player, nickname: value, tag: value === player.nickname ? player.tag : null,
        pitch: chosen, pending: true };
      storePlayer();
    } finally {
      button.disabled = false;
    }
    if (!form.isConnected) return;
    if (first) {
      if (!P.runs && !P.tut.welcome) renderWelcome();
      else renderHome();
    } else {
      tag.textContent = player.tag ? `${player.nickname}#${player.tag}` : player.nickname;
      status.textContent = player.pending ? 'Zapisano na tym urządzeniu.' : 'Zapisano.';
    }
  };
}

function launchRankedRun(game) {
  player.played = true;
  storePlayer();
  scoreRun = profileOnline && player.nickname
    ? playerRequest('run/start', { game }).catch(() => null)
    : Promise.resolve(null);
}

function submitRankedScore(game, score) {
  const run = scoreRun;
  scoreRun = null;
  if (!run) return;
  return run.then(ticket => ticket ? playerRequest('run/finish', { game, score, runId: ticket.runId }) : null)
    .catch(error => ({ submissionError: error.message }));
}

async function loadLeaderboard(key, panel, submission) {
  if (!profileOnline) { panel.textContent = 'Ranking jest dostępny po połączeniu z serwerem.'; return; }
  try {
    const result = await submission;
    const board = result?.top ? result : await playerRequest('leaderboard', { game: key });
    if (!panel.isConnected) return;
    const { top, you, total } = board;
    panel.replaceChildren();
    const summary = document.createElement('p');
    summary.textContent = you ? `Twój rekord: ${you.score} · #${you.rank} z ${total} graczy` :
      `Twój rekord: — · ${total} graczy`;
    const rows = document.createElement('ol'), toggle = document.createElement('button');
    toggle.className = 'link';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'ranking-rows');
    rows.id = 'ranking-rows';
    let expanded = false;
    function paint() {
      rows.replaceChildren();
      const entries = top.slice(0, expanded ? 10 : 3);
      if (expanded && you && !entries.some(row => row.you)) entries.push(you);
      for (const entry of entries) {
        const row = document.createElement('li');
        row.classList.toggle('your-score', entry.you);
        row.textContent = `#${entry.rank} · ${entry.name} · ${entry.score}`;
        rows.append(row);
      }
      gap.hidden = !expanded || !you;
      if (you) gap.textContent = `Do następnej pozycji: ${you.gapNext ?? '—'} · Do 1. miejsca: ${you.gapFirst}`;
      toggle.textContent = expanded ? 'Pokaż mniej' : 'Pokaż więcej';
      toggle.setAttribute('aria-expanded', String(expanded));
    }
    const gap = document.createElement('p');
    toggle.onclick = () => { expanded = !expanded; paint(); };
    panel.append(summary, rows, gap, toggle);
    if (result?.submissionError) {
      const status = document.createElement('small');
      status.textContent = result.submissionError;
      panel.append(status);
    }
    paint();
  } catch (_) {
    if (panel.isConnected) panel.textContent = 'Nie udało się wczytać rankingu.';
  }
}
