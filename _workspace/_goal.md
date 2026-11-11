# Goal (immutable for this run)

run_id: run-mwcmunb7 (2026-11-11, armed by the G11 run-armer hook)
feature: Field lessons — absorb every project built under C:\sites into CoolHan so future sites inherit what worked and are mechanically kept from repeating what failed
operator_command: |
  «지금 c://site 폴더에서 만들었고, 만들고 있는 사이트들에서 쿨한모듈에 적용할 내용들을 흡수하여 앞으로 만들 사이트들에
  적용하고 싶다. 개발을 성공적으로 그리고 단시간에, 구현이 잘되게 한 방법들 그리고 에러가 없는 구현방법을 찾아내서
  적용하고, 실패한 사례들을 찾아내서 이것을 따라하지 않는 방지 구현을 하라. 쿨한 빌더의 목적은 사람의 명령없이
  기획서를 제대로 제작하여 기획서에 맞는 결과물을 사람의 추가적인 명령 없이 쿨한에이전트로 완성을 하는것이다.
  지금까지 개발작업을 했던 모든 사이트들로 쿨한빌더가 고도화되어 쿨한빌더의 목적에 맞게 구축되어야한다.
  각 에이전트를 이용하여 분석하여 쿨한빌더를 고도화하라»
purpose_fit: |
  CoolHan's purpose: produce a correct 기획서 with no human command, then complete a result that matches it with no
  further human command. Past projects are the only real evidence of (A) what made that succeed quickly and without
  errors and (B) what broke. Both must reach future projects through the harness itself: a lesson registry that agents
  read, a plan-time requirement that each applicable failure pattern has a stated prevention, and executable checks for
  the patterns a script can detect.
scope_boundary (P0):
  - IN: read-only analysis of the projects under C:\sites by analysis agents; a generalized lesson registry (single
    source) + a human-readable KB doc derived from it; mechanical gate(s) for detectable failure patterns; plan-time
    enforcement (the 기획서 must answer each applicable failure pattern); a field module catalog pointing at reusable
    module specs; wiring into the relevant agents and the orchestrator; tests; adversarial track; release.
  - OUT: editing any project other than this repository; copying another project's source, customer data, secrets,
    business figures or personal data into this (public-remote) repository; deploying anything; changing G1–G21
    verdict logic beyond adding inputs.
  - Privacy: this repository has a public remote. Lessons are stored generalized. Per-project evidence files stay in
    the git-ignored `.coolhan-private/`.
definition_of_done:
  - every evidenced project family under C:\sites analysed by an agent, coverage stated per family
  - lesson registry is the single source; KB table and agent checklists are derived from it, not hand-copied
  - each mechanically detectable failure pattern has a check with a test; each non-detectable one names the agent
    and the plan section that carries it
  - a 기획서 that ignores an applicable failure pattern fails the plan gate
  - full jest green, fixed check list (docs/CHECKS.md) 통과 n · 실패 0 · 확인 안 함 0, adversarial track 0 false +/-
  - released (tag, CI green), ledger and backlog 완료 with evidence
