# Issue → PR: Bug reports to tested PRs with IBM Bob

- **Hackathon:** IBM Bob 2.0 Hackathon
- **Equipo:** Yanero Rockstar
- **Enviado:** 2026-09-25
- **Página publicada:** https://lablab.ai/ai-hackathons/ibm-bob-2-hackathon/yanero-rockstar/issue-pr-bug-reports-to-tested-prs-with-ibm-bob

## Paso 1 — Basic Information

### Submission Title
```
Issue → PR: Bug reports to tested PRs with IBM Bob
```

### Short Description
```
Bob 2.0 custom modes that take a bug report to a review-ready PR: reproduce it with a failing test, find the root cause, apply a guarded fix, write the PR. Fixed 9/10 realistic bugs, verified by hidden tests, ~2 Bobcoins each.
```

### Long Description
```
**The broken workflow.** Going from a bug report to a merged fix is mostly glue work: reading a vague
report, writing a reproduction, hunting through the codebase, patching, re-running the suite and writing
the PR description. It is slow, and it is where AI assistants usually cut corners: "fixing" a bug by
weakening the test, or patching the symptom instead of the cause.

**What we built.** Five IBM Bob 2.0 custom modes (`.bob/custom_modes.yaml`) that turn one command,
`/Issue → PR Fix @issues/ISSUE-004.md`, into a branch with a regression test, a root-cause fix and a PR
write-up:

1. **🎯 Issue → PR (orchestrator):** creates the branch and runs each stage as a visible Bob subtask,
   gating every step on the previous one's result. It never edits code itself.
2. **🧪 Reproducer:** writes the smallest pytest test that fails for the reported reason.
3. **🔍 Diagnoser:** read-only root-cause analysis with symbol navigation and a cheaper `explore`
   subagent. Reports file:line and every other place with the same mistake.
4. **🔧 Fixer:** minimal fix, iterating until the full suite is green.
5. **📝 PR Writer:** commits and writes the PR description (root cause, fix, verification, risk).

**Guardrails enforced by Bob, not by prompts.** Each mode's edit access is restricted with `fileRegex`:
the Reproducer can only touch `tests/`, the Fixer can only touch `shopcart/` and **cannot modify tests**,
and the Diagnoser cannot edit at all. So the agent physically cannot "pass" by editing the test.

**Honest measurement.** We seeded 10 realistic bugs (rounding, off-by-one dates, shared mutable state,
overselling inventory, CSV quoting, BOM encoding, ID reuse…) into a Python order-management library, written
up as user-style bug reports. Every fix is scored by **hidden acceptance tests stored outside the repo**
(Bob never sees them), and only counts if the full existing suite still passes.

**Results.** **9/10 bugs fixed** as judged by the hidden tests, for **~18 Bobcoins total (~2 per fixed bug)**,
in three batched Bob tasks. Every fix landed on its own branch with a regression test, a conventional commit and
a PR description, and no existing test assertion was changed on any branch.

**The one miss is the most useful result.** ISSUE-005 (a reorder cart that mutates a past order) is a
shared-mutable-state bug with two call sites. Bob fixed the one described in the report (`reorder()`) and
all visible tests went green, but it missed the same aliasing in `place()`. The hidden tests caught the
incomplete fix, and a second independent run made the same choice. That is exactly the failure mode that
slips through code review, and why the pipeline is graded on tests the agent cannot see.

**Bob 2.0 features used.** Custom modes, Agent mode, subtasks (`start_subtask`), `explore` subagents, todo
lists, per-mode tool groups and `fileRegex` edit restrictions, symbol navigation, terminal execution.
```

**Categories:** Agent Builder track - The INTERNET OF AGENTS · Developer Tools

**Technologies:** IBM · Claude Code · Github Copilot · Generative Agents

### Ibm bob usage statement
```
IBM Bob 2.0 (IDE v2.1.0) is the core of this project: every bug fix, regression test, commit and PR description in the repo was produced by Bob running my custom workflow.

1) Custom modes. I defined five project-level modes in sample-app/.bob/custom_modes.yaml: an orchestrator ("Issue → PR"), Reproducer, Diagnoser, Fixer and PR Writer. Each has its own roleDefinition, customInstructions and tool groups.

2) Guardrails with tool groups and fileRegex. The orchestrator only has read, execute, subtask and todo, so it cannot edit code. The Reproducer can only edit tests/test_*.py, the Fixer can only edit shopcart/*.py (so it cannot weaken tests to make them pass), the PR Writer can only edit prs/*.md, and the Diagnoser has no edit rights, with only the "explore" subagent allowed for cheap read-only searches.

3) Subtasks and todo lists. One command (/Issue → PR, "Fix @issues/ISSUE-002.md @issues/ISSUE-001.md ...") makes the orchestrator create a git branch per issue, keep a todo list, and run each stage with start_subtask in the matching mode, so every stage is visible in its own breadcrumb conversation. Each stage is gated on the previous one: the test must fail for the reported reason, the diagnosis must give file:line, and the full pytest suite must be green before the PR stage.

4) Agent mode, terminal execution and symbol navigation. Bob ran git and pytest in the integrated PowerShell terminal, read code with symbol tools, and applied diffs. I used per-task auto-approve permissions (Execute, Todo, Subtask) for the batch runs.

5) Iterating on Bob's behaviour. A smoke run on one issue (2.45 Bobcoins) showed the Reproducer treating pytest's exit code 1 as an error and diagnosing too early. I tuned the mode instructions, and the next run of the same stage cost about 25% less.

6) Measured results. Three batched Bob tasks fixed 10 issues for about 18 Bobcoins. Hidden acceptance tests stored outside the workspace (Bob never saw them) confirmed 9/10 fixes, with no existing test assertions changed. Bob's miss (ISSUE-005: fixed one of two aliasing call sites) is documented honestly.

The sample project, hidden tests and scoring scripts are an evaluation harness prepared outside Bob. This project does not use watsonx.ai or watsonx Orchestrate.

IBM Bob 2.0, Python, pytest, Git, AI agents, Developer productivity, Debugging, Code review
```

## Paso 2 — Media

| Campo | Archivo | Original en lablab |
|---|---|---|
| Cover Image | [`media/portada.jpg`](../media/portada.jpg) | [enlace](https://storage.googleapis.com/lablab-static-eu/submissions/elpyqlciup4n4gou3skvkgqi/q4nxe0ansiyqcr0nyq83l48r/image/image_kwfs2n39f3mcfv82mg2mf49r.jpg) |
| Slide Presentation (PDF) | [`media/presentacion.pdf`](../media/presentacion.pdf) | [enlace](https://storage.googleapis.com/lablab-static-eu/submissions/elpyqlciup4n4gou3skvkgqi/q4nxe0ansiyqcr0nyq83l48r/presentation/presentation_onmgg2qkahtqxw5v3i99mdhh.pdf) |
| Video Presentation | [`media/video.mp4`](../media/video.mp4) | [enlace](https://storage.googleapis.com/lablab-video-submissions/submissions/elpyqlciup4n4gou3skvkgqi/q4nxe0ansiyqcr0nyq83l48r/video/video_mdec0im9g5rwvjjgyfjk02pm.mp4) |

## Paso 3 — Application

- **GitHub Repository:** https://github.com/yanerox69/issue-to-pr-bob
- **Demo Platform:** OTHER
- **Demo URL:** https://github.com/yanerox69/issue-to-pr-bob

## Reseñas del jurado

| Valor de negocio | Originalidad | Presentación | Uso de la tecnología | Comentario |
|---|---|---|---|---|
| 2 | 2 | 3 | 3 |  |
| 3 | 3 | 4 | 4 | Strong, idiomatic use of Bob 2.0 features: custom modes, subtasks, explore subagents, and fileRegex edit restrictions that physically stop the Fixer from editing tests. The hidden-acceptance-test evaluation (9/10, ~2 Bobcoins per fix) is rigorous, and reporting the one miss honestly adds credibility. The idea of automating bug-to-PR is not new, but the enforcement-by-design approach is well executed. Evaluation uses seeded bugs in one Python library, so generalization to real repos is the open question. |
