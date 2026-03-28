# Sub-agent 7: Update or replace the framework

**Goal:** Align canvas dependency and plugin architecture with realistic effort.

## Instructions for the agent

1. **Fabric.js:** Demo ships Fabric 1.4.x. Upgrading to Fabric 5+/6+ is a **large** API migration; scope either (a) document as future phase with breaking-change notes, or (b) execute a dedicated migration PR with visual regression checks.
2. **jQuery / Angular / React:** Only change if present; this project is vanilla + Fabric.
3. **Backbone-style extend:** Keep unless rewriting the plugin system; note coupling in docs.

## Deliverables

- Explicit decision: “upgrade Fabric now” vs “documented follow-up”
- If upgraded: updated vendor or npm dependency, fixed APIs, changelog entry

## Base branch

Stack on the branch merged from sub-agent 6.
