// Adres głównego serwera (homelab, Tailscale Funnel). Zmień tutaj, jeśli się zmieni.
window.ASTRO_SERVER = 'https://skylab.tail20896a.ts.net';
window.astroProbe = function (ms) {
  return fetch(window.ASTRO_SERVER + '/healthz?t=' + Date.now(), { signal: AbortSignal.timeout(ms || 3000) })
    .then(function (r) { return r.ok; }, function () { return false; });
};
