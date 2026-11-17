# Track 42 findings (kit defects met while building a real small site with the kit)

Written as they were met, before any fix. Each one names what was observed and where.

| # | Met at | Observed | Kind |
|---|---|---|---|
| K-1 | Planning gate, main document only | `plan-doc-check` PASSED with only the main document, the common rules, the lesson plan and the module plan present. None of the four deliverables (DB, screens, design, source) existed yet, and the trace table pointed at files that did not exist. Standing order O-05 (four deliverables as files) was not enforced by the gate the kit lists as C2 | gate gap |
| K-2 | Fresh headless session | The bundled command-line client answered «Not logged in» in a folder outside the app, so the supervisor's default command cannot start a session on this machine until the operator logs the client in. `nonstop.js` would count that as three sessions without progress and stop with NO_PROGRESS, without naming the cause | supervisor gap |
