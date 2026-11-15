# Deploy to the homelab (CD)

A push to `main` => the workflow `.github/workflows/deploy.yml` runs on a self-hosted runner (label `skylab`) and in `~/astromeow` does: database backup, `git reset --hard origin/main`, `counter.sh test`, `run.sh -d`, `run.sh status`.
Deploys do not run in parallel (`concurrency`), the job has a 15 min timeout. Manually: Actions -> Deploy -> Run workflow.

## Runner (once, on the homelab, user `bartek`)
On GitHub: Settings -> Actions -> Runners -> New self-hosted runner (Linux) shows the package and a token. Then:
```bash
git clone git@github.com:bartekdylewski/astromeow.git ~/astromeow    # if it is not there yet
mkdir -p ~/actions-runner && cd ~/actions-runner
# curl + tar with the package from the GitHub page, then:
./config.sh --url https://github.com/bartekdylewski/astromeow --token <TOKEN> --labels skylab --unattended
sudo ./svc.sh install bartek
sudo ./svc.sh start
sudo ./svc.sh status
```

## Does `run.sh -d` survive the end of the job?
Not without a fix. `setsid` is not enough: when the job ends, the runner kills every process
that has `RUNNER_TRACKING_ID` in its environment (inherited by children, also after `setsid`).
Solution: `RUNNER_TRACKING_ID="" bash run.sh -d` (one variable, no changes in `run.sh`).
systemd cgroup: the unit from `svc.sh` has `KillMode=process`, so stopping/restarting the runner service
(e.g. an auto-update) kills only the runner process, not its children. If the server still disappears,
the fallback is `systemd-run --user --collect bash run.sh -d` (needs `loginctl enable-linger bartek`).
To check on the first deploy: after the job ends run `bash ~/astromeow/run.sh status`.

## Backup before a deploy, and restoring
The first step of the job copies SQLite (online backup API, without stopping the server) to
`~/astromeow-backup/pre-deploy/YYYY-MM-DD_HHMMSS-<sha7>/counter.db`, sets the pointer
`~/astromeow-backup/pre-deploy/LAST` and keeps the 30 latest. No database (first deploy) = the step is skipped.
Restoring:
```bash
cd ~/astromeow
bash run.sh stop
cp "$(cat ~/astromeow-backup/pre-deploy/LAST)/counter.db" counter/data/counter.db
bash run.sh -d
```

## Ruleset on `main` (after the workflow is deployed, by hand)
Settings -> Rules -> Rulesets -> New branch ruleset, target `main`:
- Restrict deletions, Block force pushes
- Require a pull request before merging (0 approvals)
- Require status checks: `test` (from `ci.yml`; it appears only after the first PR)
- Bypass list: Repository admin

The same through the CLI:
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
(`actor_id: 5` = the Admin role.) Once the ruleset is on, a push to `main` means merging a PR, so the deploy runs after the merge.
