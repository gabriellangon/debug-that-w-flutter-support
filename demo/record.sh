#!/bin/bash
# Automated demo recording — simulates typing with controlled timing
# Usage: cd demo && asciinema rec recording.cast --command "bash record.sh"

type_cmd() {
  local cmd="$1"
  local delay="${2:-0.02}"

  for (( i=0; i<${#cmd}; i++ )); do
    printf "%s" "${cmd:$i:1}"
    sleep "$delay"
  done
  sleep 0.3
  printf "\n"
}

wait_and_run() {
  local cmd="$1"
  local pause_before="${2:-1.5}"
  local pause_after="${3:-2}"

  sleep "$pause_before"
  printf "\033[1;32m❯\033[0m "
  type_cmd "$cmd"
  eval "$cmd"
  sleep "$pause_after"
}

# --- Demo starts ---

# 1. Show the bug
wait_and_run "bun app.ts" 0.5 2

# 2. Launch debugger
wait_and_run "dbg launch --brk bun app.ts" 1 1

# 3. Set breakpoint
wait_and_run "dbg break app.ts:18" 0.5 0.5

# 4. Continue to breakpoint
wait_and_run "dbg continue" 0.5 2

# 5. Step over — the aha moment
wait_and_run "dbg step" 1 3

# 6. Reproduce the bug in the eval
wait_and_run 'dbg eval "subtotal + order.shipping"' 0.8 1.5

# 7. Confirm the type
wait_and_run 'dbg eval "typeof order.shipping"' 0.8 1.5

# 8. Verify the fix
wait_and_run 'dbg eval "subtotal + Number(order.shipping)"' 0.8 1.5

# 9. Clean up
wait_and_run "dbg stop" 1 0.5
