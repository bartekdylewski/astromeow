#!/usr/bin/env bash
# run.sh został przeniesiony do katalogu aplikacji (astromeow/). Ten plik jest tylko przekaźnikiem – można go usunąć.
exec bash "$(dirname "${BASH_SOURCE[0]}")/../run.sh" "$@"
