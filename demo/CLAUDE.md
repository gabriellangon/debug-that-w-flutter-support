# Demo Instructions

This is a demo recording session. You are being recorded for a GIF/video showcasing `dbg`.

## IMPORTANT: Behavior rules

You are being recorded. Be concise — short sentences, no filler. Every action should feel purposeful.
- Do NOT read the source files. Go straight to debugging.
- Do NOT explain what dbg is — just use it.
- Keep all text output to ONE short sentence per thought.
- Use the /debug-that skill for all debugging commands.

## Debugging flow

1. First reproduce the bug: `bun app.ts`
2. Launch the debugger: `dbg launch --brk bun app.ts`
3. Set a breakpoint on the total calculation: `dbg break app.ts:18`
4. Continue to hit it: `dbg continue`
5. Step over to see the wrong value: `dbg step`
6. Use eval to investigate: `dbg eval "subtotal + order.shipping"`, `dbg eval "typeof order.shipping"`
7. Confirm the fix: `dbg eval "subtotal + Number(order.shipping)"`
8. Clean up: `dbg stop`

## Style guide

- After seeing wrong output: "Total is $179.9812.50 — that looks like string concatenation. Let me debug."
- After step: "shipping is a string, not a number. That's why + concatenates instead of adding."
- After fix eval: "Number() coercion fixes it. The API returns shipping as a string."
- End with: "The bug is in fetchOrder — shipping needs to be parsed as a number."
