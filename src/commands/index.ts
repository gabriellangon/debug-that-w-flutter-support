// Barrel file — import all command definitions to register them via defineCommand()

// Session
import "./launch.ts";
import "./attach.ts";
import "./stop.ts";
import "./sessions.ts";
import "./status.ts";

// Execution
import "./continue.ts";
import "./step.ts";
import "./run-to.ts";
import "./pause.ts";
import "./restart.ts";
import "./restart-frame.ts";

// Inspection
import "./state.ts";
import "./vars.ts";
import "./stack.ts";
import "./eval.ts";
import "./props.ts";
import "./source.ts";
import "./search.ts";
import "./scripts.ts";
import "./modules.ts";
import "./console.ts";
import "./exceptions.ts";

// Breakpoints
import "./break.ts";
import "./break-rm.ts";
import "./break-ls.ts";
import "./break-toggle.ts";
import "./breakable.ts";
import "./logpoint.ts";
import "./catch.ts";
import "./break-fn.ts";

// Mutation
import "./set.ts";
import "./set-return.ts";
import "./hotpatch.ts";

// Blackboxing
import "./blackbox.ts";
import "./blackbox-ls.ts";
import "./blackbox-rm.ts";

// Source Maps
import "./sourcemap.ts";

// Debug Info
import "./path-map.ts";
import "./symbols.ts";

// Setup
import "./install.ts";

// Diagnostics
import "./logs.ts";
