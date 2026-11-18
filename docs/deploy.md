# Deploy

Production runs on a homelab (`skylab`) and is published through Tailscale Funnel.

## How it works

A push to `main` runs `.github/workflows/deploy.yml` on a self-hosted runner (label `skylab`):
database backup, `git reset --hard origin/main`, tests, `systemctl --user restart astromeow`, health check.
Deploys are queued (`concurrency`), never parallel. Manual run: Actions -> Deploy -> Run workflow.

## One-time setup (user `bartek` on the homelab)

**Runner:** GitHub -> Settings -> Actions -> Runners -> New self-hosted runner (Linux), then
```bash
./config.sh --url https://github.com/bartekdylewski/astromeow --token <TOKEN> --labels skylab --unattended
sudo ./svc.sh install bartek && sudo ./svc.sh start
```

**Server as a systemd user service** (starts on boot, restarts on crash):
```bash
mkdir -p ~/.config/systemd/user
cp deploy/astromeow.service ~/.config/systemd/user/
loginctl enable-linger bartek            # needs sudo once
systemctl --user enable --now astromeow
```
Optional secrets go in `~/.config/astromeow.env` (never commit it), for example `NASA_API_KEY=...`.
Logs: `journalctl --user -u astromeow -f`.

**Public URL** (Tailscale Funnel; enable HTTPS Certificates and Funnel in the Tailscale admin first):
```bash
sudo tailscale funnel --bg 8085
```

## Restore the database

Each deploy saves a copy to `~/astromeow-backup/pre-deploy/<timestamp>-<sha>/counter.db` (30 kept; the latest is in `LAST`).
```bash
systemctl --user stop astromeow
cp "$(cat ~/astromeow-backup/pre-deploy/LAST)/counter.db" ~/astromeow/counter/data/counter.db
systemctl --user start astromeow
```

## Branch protection

Recommended ruleset on `main`: no deletion, no force push, pull request required, status check `test` (from `ci.yml`).
