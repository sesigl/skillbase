#!/usr/bin/env bash
set -euo pipefail
exec biome format --write "$@"
