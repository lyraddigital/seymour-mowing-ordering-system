# Seymour Dashboard UX handoff

Copy the contents of this package into the repository root, preserving paths.

Expected result:

```text
AGENTS.md
UX-DESIGN.md
CODEX-DASHBOARD-UX-PROMPT.md
docs/
  ux/
    dashboard-populated-reference.png
    dashboard-empty-reference.png
```

Then give Codex the contents of:

```text
CODEX-DASHBOARD-UX-PROMPT.md
```

## What the two designs mean

`docs/ux/dashboard-populated-reference.png`

- populated Dashboard composition
- metric row
- Needs attention table
- partially paid/unpaid table
- recent Payments table
- Today's Jobs populated treatment

`docs/ux/dashboard-empty-reference.png`

- same Dashboard geometry with zero-data content
- Needs attention empty
- partially paid/unpaid empty
- Recent Payments empty
- Today's Jobs empty

## Important written overrides

The populated image is an earlier concept and its visual layout remains useful, but these requirements supersede incidental details:

- replace `Customers overdue` with `Invoices overdue`
- do not add a top-right login/user block
- keep the repository's existing placeholder image in the sidebar for this phase
- do not add Settings or Log out
- do not add a graph/cash-flow chart

`AGENTS.md`, `UX-DESIGN.md`, and `CODEX-DASHBOARD-UX-PROMPT.md` are authoritative.

## Domain guard

Overdue calculations require authoritative Invoice due dates.

If the repository does not yet support Invoice due dates, Codex must not invent a policy or present fake zero overdue figures. It should implement only truthful Dashboard data and report the missing due-date prerequisite.
