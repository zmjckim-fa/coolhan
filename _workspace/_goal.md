# Goal (immutable for this run)

run_id: run-g23-2026-11-17
feature: Standing orders and project kit: the commands the operator repeated in every project are installed once, and the module library is a required planning input
operator_command: |
  «지금까지 모든 세션에서 여러 사이트를 만들면서 수많은 명령을 내리고 뭔가 반복해서 만들고 있다. 여러 사이트를 만들었고
  상용화도 했다. 그런데 또 다른 사이트를 만드는데 또 매번 명령을 비슷한것을 한다.»
  «00module 폴더에 지금까지 만든것들을 모듈로 저장을 해놓았다. 이용하자»
purpose_fit: |
  CoolHan's purpose is a correct 기획서 with no human command and a matching result with no further command. Every
  command the operator had to repeat is a place where that purpose failed. The repeated commands become standing
  orders a project folder carries from its first minute, and the module library becomes an input the plan must answer.
scope_boundary (P0):
  - IN: mining the private operator-message store for repeated commands; orders as registry data; a project kit
    (installer, launcher, templates, generated handoff); loop arming on the operator's own continuation words inside
    a kit project; a module plan with one row per library bundle and a plan gate for it; agent and skill wiring;
    tests; adversarial track; release.
  - OUT: editing the module library or any other project; copying module source into this repository; deploying
    anything; installing skills into the operator's user folder; changing G1-G22 verdict logic beyond adding inputs
    (one exception recorded in the changelog: an empty plan folder is NOT_RUN instead of a usage error).
  - Privacy: public remote. Raw messages and project names stay in the git-ignored private folder.
definition_of_done:
  - orders live in one registry and the project CLAUDE.md block is derived from it
  - a new folder and an existing folder both receive the kit; nothing the project already had is overwritten
  - the operator's continuation words arm the loop in a kit project; one-shot orders and questions do not
  - a plan that leaves a library bundle unanswered fails the plan gate
  - full jest green, docs/CHECKS.md 통과 n · 실패 0 · 확인 안 함 0, adversarial track 0 false +/-
  - released (tag, CI green), ledger and backlog 완료 with evidence
