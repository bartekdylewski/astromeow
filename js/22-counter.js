'use strict';
/* ===================== LICZNIK WEJŚĆ =====================
   Wysyła jedno zgłoszenie przy starcie gry (unikalność robi cookie po stronie serwera).
   ?src=scena z adresu QR jest przekazywane dalej. Błąd licznika NIGDY nie psuje gry. */
try {
  fetch('/api/hit' + location.search, { method: 'POST', keepalive: true }).catch(() => {});
} catch (e) { /* np. otwarte z file:// – ignorujemy */ }
