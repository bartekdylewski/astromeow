# Deploy na homelab (CD)

Push do `main` => workflow `.github/workflows/deploy.yml` odpala się na self-hosted runnerze (label `skylab`) i w `~/astromeow` robi: backup bazy, `git reset --hard origin/main`, `counter.sh test`, `run.sh -d`, `run.sh status`.
Deploye nie biegną równolegle (`concurrency`), job ma timeout 15 min. Ręcznie: Actions -> Deploy -> Run workflow.

## Runner (raz, na homelabie, user `bartek`)
Na GitHubie: Settings -> Actions -> Runners -> New self-hosted runner (Linux) pokaże paczkę i token. Potem:
```bash
git clone git@github.com:bartekdylewski/astromeow.git ~/astromeow    # jeśli jeszcze go nie ma
mkdir -p ~/actions-runner && cd ~/actions-runner
# curl + tar z paczką ze strony GitHuba, następnie:
./config.sh --url https://github.com/bartekdylewski/astromeow --token <TOKEN> --labels skylab --unattended
sudo ./svc.sh install bartek
sudo ./svc.sh start
sudo ./svc.sh status
```

## Czy `run.sh -d` przeżywa koniec joba?
Bez poprawki NIE. `setsid` nie wystarcza: runner po zakończeniu joba ubija każdy proces,
który ma w środowisku `RUNNER_TRACKING_ID` (dziedziczone przez dzieci, także po `setsid`).
Rozwiązanie: `RUNNER_TRACKING_ID="" bash run.sh -d` (jedna zmienna, bez zmian w `run.sh`).
Cgroup systemd: unit z `svc.sh` ma `KillMode=process`, więc stop/restart usługi runnera
(np. auto-update) zabija tylko proces runnera, nie dzieci. Gdyby serwer mimo to znikał,
fallback: `systemd-run --user --collect bash run.sh -d` (wymaga `loginctl enable-linger bartek`).
Do sprawdzenia przy pierwszym deployu: po końcu joba `bash ~/astromeow/run.sh status`.

## Backup przed deployem i odtwarzanie
Pierwszy krok joba robi kopię SQLite (online backup API, bez zatrzymywania serwera) do
`~/astromeow-backup/pre-deploy/YYYY-MM-DD_HHMMSS-<sha7>/counter.db`, ustawia wskaźnik
`~/astromeow-backup/pre-deploy/LAST` i trzyma 30 ostatnich. Brak bazy (pierwszy deploy) = krok pominięty.
Odtwarzanie:
```bash
cd ~/astromeow
bash run.sh stop
cp "$(cat ~/astromeow-backup/pre-deploy/LAST)/counter.db" counter/data/counter.db
bash run.sh -d
```

## Ruleset na `main` (po wdrożeniu workflow, ręcznie)
Settings -> Rules -> Rulesets -> New branch ruleset, target `main`:
- Restrict deletions, Block force pushes
- Require a pull request before merging (0 approvals)
- Require status checks: `test` (z `ci.yml`; pojawi się dopiero po pierwszym PR-ze)
- Bypass list: Repository admin

To samo przez CLI:
```bash
gh api -X POST repos/bartekdylewski/astromeow/rulesets --input - <<'JSON'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
  "bypass_actors": [{"actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always"}],
  "rules": [
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {"type": "pull_request", "parameters": {"required_approving_review_count": 0,
      "dismiss_stale_reviews_on_push": false, "require_code_owner_review": false,
      "require_last_push_approval": false, "required_review_thread_resolution": false}},
    {"type": "required_status_checks", "parameters": {"strict_required_status_checks_policy": false,
      "required_status_checks": [{"context": "test"}]}}
  ]
}
JSON
```
(`actor_id: 5` = rola Admin.) Po włączeniu rulesetu push na `main` to merge PR-a, więc deploy odpala się po merge.
