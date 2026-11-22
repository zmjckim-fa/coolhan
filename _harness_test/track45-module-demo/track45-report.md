# Track 45: library modules installed into an empty project and opened in a real browser

## Why

Two bounds stood open after v2.12.0: no project had installed modules through the module manager (only throwaway
folders had), and the screens inside the admin modules had been type-checked and rule-tested but never rendered.
This track does both once. The project and the installed module code are private (the module library is private);
this report holds what was run and what was measured.

## What was done

| Step | What | Measured |
|---|---|---|
| Install | A React project with no module in it; ten admin and design modules taken with `modules add` | exit 0; `modules status` exit 0, ten modules current, 0 edited in the project |
| Wiring | Demo screens that mount the modules' real screens: shell with role switch, dashboard, list, detail, confirm dialog, notifications, CSV export, four themes. Invented data, no network call | type check exit 0 without casts or exclusions; build exit 0 |
| Browser | Opened at 1280px and 375px; role switched between owner, staff and viewer | console errors 0; no horizontal scroll on dashboard, list and detail at either width |
| Findings | Three module defects (below) | each measured in the browser before and after |
| Upgrade | The three fixed modules committed to the library as new versions, then the project updated through the manager | `modules status` exit 1 (three behind) → `modules update --all` exit 0 → `modules status` exit 0 |

## Defects found by opening the screens (none was visible to the form gate or the module tests)

| # | Module | Defect | Before | After |
|---|---|---|---|---|
| 1 | detail frame | The edit button was drawn for every role. The action bar was filtered by permission, the edit button had no permission input at all | viewer saw «수정» | viewer sees only «인쇄»; owner sees all three. New required property, default deny, rule tested in core. Major version |
| 2 | list frame | Row link too small to touch on a phone | 20px high at 375px | 44px at 375px, 20px at 1280px |
| 3 | shell | Top-bar chip too small to touch on a phone | 32px high at 375px | 44px at 375px, 32px at 1280px |

After the fixes, at 375px no button, link, select or text input on the list screen is lower than 44px.

## What the upgrade showed

The detail frame's fix changes its public interface, so it went out as a major version. After `modules update`
the project no longer type-checked: the call site lacked the new property (one error, with file and line). One
line in the project fixed it. A breaking module change reached the project as a compile error at the place that
had to change, not as a silent difference in behaviour. The two patch versions needed no change in the project.

## Honest bound

- One project, one stack (React 18 with Vite), one browser engine. Safari and Firefox were not opened.
- Checked: layout at two widths, console, touch target heights, role-dependent buttons. Not checked: a screen
  reader, print preview, keyboard order through every screen, 200% text size, colour contrast as rendered (the
  design module's contrast table is computed from its tokens, not sampled from the screen).
- The subagent that wired the demo reported more interactions (drawer focus, sort and filter, save guard,
  CSV content). Those were not repeated here and are its report, not this track's measurement.
- The demo does not exercise the notification module's SQL store, the polling hook, or a real sign-in.
- The demo's own screens were written for this track; a module that is hard to wire correctly would show here
  only as extra demo code, which was not measured.
- Leaving a dirty detail screen with the browser's back button is not stopped by the detail frame (only the
  browser's own unload warning applies). Recorded for the module's next version.

## Addendum (same day): the second update through the manager broke the build, and why

Twelve modules got next versions (outbound calls through the guard module, member entry points, tracking merged,
frame fixes). `modules status` in the demo project: exit 1, three behind. `modules update --all`: exit 0. Type
check: exit 2, one error. The member screens module carried copies of the detail frame's types; the frame's minor
version had added one function to its form. No module test and no admission run had shown it: each module is
admitted with what it requires, in isolation, and the copies were structurally valid on their own.

The cause was the rule that a module may import another module's `core/index` only, which made copying the only
way to build on a frame. The gate now lets a module list the files it opens (`provides.entries`); the three admin
frames list their screen files; the member screens module imports the frames' own types. The demo project took the
four new versions (`update` exit 0, `status` exit 0) and builds with no change of its own: type check exit 0, build
exit 0.

Also opened in the browser after that: the member screens (sign-up validation with focus on the first invalid field
and the error tied to it, sign-in, staff list and detail at 375px, a view-only role sees no action button, an action
asks for its reason first) and the my-page frame (horizontal tab strip at 375px, side list at 1280px, a hidden tab
and a path with `..` refused with their reasons). Console errors 0, no horizontal page scroll.
