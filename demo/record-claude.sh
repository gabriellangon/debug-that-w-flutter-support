#!/bin/bash
# Automated demo recording — Claude autonomously debugs the bug
# Usage: cd demo && asciinema rec recording-claude.cast --command "bash record-claude.sh"
#
# NOTE: Claude's responses are non-deterministic. You may need to record
# a few takes. The CLAUDE.md in this directory guides Claude's behavior.

type_cmd() {
  local cmd="$1"
  local delay="${2:-0.03}"

  for (( i=0; i<${#cmd}; i++ )); do
    printf "%s" "${cmd:$i:1}"
    sleep "$delay"
  done
  sleep 0.3
  printf "\n"
}

sleep 0.5
printf "\033[1;32m❯\033[0m "
type_cmd 'claude "bun app.ts returns the wrong total. Find the bug using dbg."'

claude "bun app.ts returns the wrong total. Find the bug using dbg."
