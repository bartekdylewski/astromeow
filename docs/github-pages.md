# Hosting na GitHub Pages

Gra jest jednym plikiem (`dist/astromeow.html`, budowany przez `build.py`), więc działa na Pages bez serwera.
Workflow: `.github/workflows/pages.yml` (push na `main` lub ręcznie z zakładki Actions).

## Ustawienia repo (jednorazowo)

1. **Upublicznij repo**: Settings → General → Danger Zone → Change visibility → Public.
   (Pages na koncie darmowym wymaga publicznego repo; hosted runnery też zaczną działać.)
2. **Włącz Pages**: Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
3. **Zezwól na deploy z `main`**: Settings → Environments → `github-pages` → Deployment branches → tylko `main` (domyślnie tak jest).
4. Uruchom: Actions → *Pages* → *Run workflow* (albo zrób push na `main`).
5. Adres: `https://<user>.github.io/astromeow/` (pokaże się też w podsumowaniu joba).

## Co działa, a co nie (bez backendu)

| Funkcja | Na Pages |
|---|---|
| Gra, quizy, minigierki, dane misji | działa (wszystko wbudowane w plik) |
| Postęp, profil, nick | działa lokalnie (`localStorage`) |
| Licznik wejść `/api/hit` | brak (błąd ignorowany) |
| Panel NASA `/api/nasa` | brak świeżych danych, tylko cache z `localStorage` |
| Sesja/ranking `/api/session`, `/api/profile` | brak, tryb offline |

Ścieżki `/api/...` są absolutne, więc na Pages trafiają w `github.io/api/...` i dostają 404. To jest bezpieczne, ale gdy backend będzie hostowany osobno, trzeba zamienić `/api/` na konfigurowalny base URL.

## Uwagi

- Istniejący `deploy.yml` (homelab, self-hosted) działa równolegle; Pages go nie zastępuje.
- Jeśli repo ma zostać prywatne: job `pages.yml` trzeba przestawić na `runs-on: [self-hosted, skylab]`, ale Pages na planie Free i tak wymaga publicznego repo.
