# Seymour Mowing Ordering System — UX/UI Design Direction

## Purpose

This document defines the visual and interaction direction for the Seymour Mowing Ordering System.

It is a product UI for day-to-day business operations, not a marketing website. The Seymour brand should be clearly recognisable, but the application should remain calm, practical, readable, and efficient for repeated daily use.

The current UX work should be treated as a design-system migration, not a collection of unrelated page-specific restyles.

## Brand Assets

For the current UX migration phase, use the existing placeholder logo/image asset already present in the repository's application shell.

Do not render `LOGO PLACEHOLDER` as text, generate a substitute logo, or replace the current placeholder image with a generic `S`. The final Seymour company logo will be integrated in a later dedicated pass.

Preserve the placeholder image's proportions and legibility.

Do not add Settings or Log out navigation entries unless they become real product requirements.

## Visual Direction

Use a restrained interpretation of the Seymour brand:

- deep forest green for navigation, primary actions, and strong brand anchors
- lawn green for selected states and restrained accents
- warm off-white / cream for the application background
- white or near-white surfaces for cards, tables, and forms
- dark green-black for primary text
- grey-green for secondary text
- muted red for destructive actions and voided/danger states
- amber may later be used for warning/overdue states

The bright lime tones from the company logo should be used sparingly. The admin UI should feel like business software, not marketing collateral.

## Initial Design Tokens

These are directional tokens. Reuse them consistently rather than introducing near-duplicate values page by page.

```text
brand-forest       #184329
brand-forest-dark  #12351F
brand-lawn         #4CAF50
brand-lawn-soft    #E7F3E2
background         #F7F8F3
surface            #FFFFFF
border             #DDE4D8
text                #173126
text-muted          #66776C
danger              #C62828
danger-soft         #FDECEC
warning             #C77A16
```

If existing accessible colours are close to these, prefer consolidating rather than changing values purely for exact matching.

## Typography

Use the existing application font unless there is a strong reason to change it.

Establish a simple hierarchy:

- page title: prominent but not oversized
- section title: clearly distinct from body content
- body text: readable at normal desktop density
- labels/helper text: smaller and muted
- financial totals: stronger weight and tabular numerals where practical

Avoid excessively tiny metadata text.

## Application Shell

Keep the left-sidebar layout.

The sidebar should:

- use a deep forest-green background
- show the real Seymour logo at the top
- contain only real navigation destinations:
  - Dashboard
  - Customers
  - Jobs
  - Invoices
  - Payments
- use a clearly visible lawn-green active state
- show the signed-in user compactly at the bottom if the application already exposes that information
- not contain Settings or Log out unless those functions actually exist

The main workspace should use considerably more desktop width than the old UI.

Use a responsive main content container around 1200–1360px maximum width for data-heavy screens, with sensible page gutters.

Forms may use a narrower content width where appropriate.

## Shared Page Structure

Pages should follow a predictable information hierarchy.

### List pages

```text
Breadcrumb/context when useful

Page title                                      Primary action
Short description

Optional tabs / filters

Primary data table/list
```

### Detail pages

```text
Breadcrumb

Entity title + status                           Primary/secondary action
Short context line

Important summary / lifecycle state

Primary information
Related operational or financial data
History

Danger zone at the bottom
```

Do not present every section as an equal-weight card simply because it is easy to implement.

## Buttons and Actions

Use clear action hierarchy.

### Primary

Use a filled forest-green button for the main action on a screen.

Examples:

- New customer
- New job
- Create invoice
- Save changes
- Issue invoice
- Record payment

### Secondary

Use an outlined/neutral button or text action for secondary actions.

Examples:

- Edit
- Cancel
- Edit draft

### Destructive

Use red styling only for genuinely destructive/lifecycle-ending actions.

Examples:

- Archive customer
- Cancel job
- Void invoice
- Void payment

Destructive actions should normally live in a clearly separated Danger zone rather than beside routine actions.

## Status Badges

Use compact badges rather than plain status text where statuses materially affect workflow.

Examples:

- Scheduled
- In progress
- Completed
- Cancelled
- Draft
- Issued
- Voided
- Active
- Archived

Badges should use consistent colours across the application.

Do not use saturated colour fills for large areas.

## Cards and Panels

Cards are for grouping related information, not for wrapping every piece of content.

Prefer:

- cards for compact entity information or summaries
- tables for repeatable records
- simple section separators for long-form/detail content
- metric cards for important financial summaries

Avoid deeply nested cards.

## Tables / Data Lists

Customers, Jobs, Invoices, and Payments list pages should use scan-friendly tabular/data-list layouts on desktop.

Rows should contain only information needed to identify and compare records.

Do not place all available detail information into list rows.

Prefer entire-row navigation or a clear final View action.

Lifecycle operations belong primarily on detail pages, not as large buttons inside every list row.

## Forms

Forms should use consistent field sizes, spacing, labels, helper text, validation, and action placement.

For longer forms:

- group fields into meaningful sections
- avoid excessive card nesting
- put Save/Create and Cancel in a predictable footer/action row
- keep labels visible
- clearly distinguish helper text from errors

## Customer Address Rule

For the current business, all Customers are in Victoria.

The Customer create/edit UI must not expose a State field.

Persist:

```text
state = "VIC"
```

server-side when creating/updating Customer address data.

Do not use a hidden client form field as the authority for this value.

Keep the existing database column for future flexibility.

Display `VIC` as part of formatted addresses where appropriate.

The form layout should therefore be:

```text
Address line 1
Address line 2

Suburb                       Postcode
```

## Customer Flow Reference

The first UX migration should establish the design system through the Customer workflow before redesigning the entire application.

### Customers list

Use a compact table/data list with columns similar to:

```text
Customer | Email | Phone | Address
```

Provide:

- page title and description
- `New customer` as the clear primary action
- Active / Archived navigation as tabs or a compact secondary control
- clean empty states

Do not place archive/restore/lifecycle actions directly in normal list rows unless required by the current workflow.

### Create/Edit Customer

Use the same form structure for Create and Edit.

Suggested sections:

- Customer
- Contact
- Address
- Notes

Remove State from the form and persist `VIC` server-side.

### Customer Detail

Use this hierarchy:

1. breadcrumb
2. Customer name + Active/Archived status
3. Edit or Restore primary action as applicable
4. contact/address/notes information
5. financial overview metrics
6. invoices table
7. payments table
8. Danger zone containing Archive customer for active Customers

Financial overview should visually emphasise:

- Total invoiced
- Payments received
- Outstanding balance

Invoice and Payment history should be tables rather than loose equal-weight cards.

For archived Customers:

- clearly show Archived state
- explain that details/history are preserved
- expose Restore customer prominently
- do not show normal edit/archive actions

## Dashboard Reference Direction

The Dashboard is a financial/operational attention screen. Its job is to show cash exposure, invoices that need action, recent money received, and today's work.

### Reference files

Use both references:

```text
docs/ux/dashboard-populated-reference.png
docs/ux/dashboard-empty-reference.png
```

`dashboard-populated-reference.png` is the reference for the populated layout and density.

`dashboard-empty-reference.png` is the reference for the zero-data state.

Important written overrides to the populated reference:

- the third metric is `Invoices overdue`, not `Customers overdue`
- do not add/show a top-right login/user block
- the current application placeholder image remains the sidebar brand asset for this phase
- no Settings or Log out navigation items
- do not add a graph/cash-flow chart

### Header

Use:

- title: `Dashboard`
- supporting copy: `Financial health and operational activity at a glance.`

Keep the header visually clean. Do not add login/account UI in the top-right.

A date control should only exist if it is backed by real Dashboard behaviour. Do not add a decorative/non-functional date picker just because one appears in a concept image.

### Primary metrics

Render four equal-weight metric cards in this order:

1. `Outstanding balance`
2. `Overdue balance`
3. `Invoices overdue`
4. `Payments received this month`

Do not show entity-count KPIs such as Active Customers.

Suggested semantics:

- Outstanding balance: remaining balance across payable issued Invoices
- Overdue balance: remaining balance on overdue issued Invoices
- Invoices overdue: count of overdue issued Invoices
- Payments received this month: active/non-voided Payments received in the current calendar month

### Populated desktop composition

Immediately below the metric row:

#### Left — Needs attention

Large primary section.

Heading:

`Needs attention`

Supporting text:

`Invoices that need your focus.`

Primary content is overdue Invoices.

Useful columns:

- Customer
- Invoice
- Due date
- Days overdue
- Balance

#### Upper right — Partially paid / unpaid invoices

Compact table.

Useful columns:

- Customer
- Invoice
- Status
- Balance

#### Lower right — Recent payments

Compact table.

Useful columns:

- Date
- Customer
- Invoice
- Amount

#### Full-width bottom — Today's jobs

Use the existing Job lifecycle/status data.

The populated reference uses compact status summaries for today's scheduled/in-progress/completed/remaining work. Preserve that operational-summary feel instead of turning it into another financial table unless the existing Job UI already has an equivalent established pattern.

### Empty-state composition

The empty Dashboard uses the same geometry as the populated Dashboard. Do not move or resize sections because there is no data.

#### Needs attention

Title:

`All caught up!`

Supporting text:

`There are no invoices that need attention right now.`

#### Partially paid / unpaid invoices

Title:

`No unpaid invoices`

Supporting text:

`All invoices are paid in full. Great work!`

#### Recent payments

Title:

`No recent payments`

Supporting text:

`Payments you receive will appear here.`

There must be no sample Payment rows in this state.

#### Today's jobs

Title:

`No jobs scheduled today`

Supporting text:

`Enjoy the day! New jobs will appear here when they're scheduled.`

### Empty-state visual treatment

Empty states should remain inside the normal section card.

Use:

- a restrained semantic icon
- centred title
- one short explanatory sentence
- generous but not excessive whitespace

Do not add charts to fill empty space.

### Data integrity

Dashboard values are derived, not stored.

Do not fabricate overdue data.

If the repository does not contain an authoritative Invoice due-date rule, overdue totals/counts/rows cannot be treated as known zeros. The implementation must use existing due-date domain support or report that prerequisite rather than inventing a due-date policy in a UX task.

### Shell consistency

The Dashboard must use the same accepted shell as Customers:

- existing placeholder image in the sidebar for this phase
- Dashboard
- Customers
- Jobs
- Invoices
- Payments
- no Settings
- no Log out
- no top-right login/user block

## Job Detail Reference Direction

The Job detail screen should eventually use this hierarchy:

1. breadcrumb
2. Job title + status
3. Customer and scheduled-date context
4. routine actions / lifecycle actions
5. Job information and description
6. Job Items table and total
7. Invoice relationship / create-invoice action
8. Danger zone containing Cancel Job where legal

Do not mix Edit, Start, Complete, and Cancel as equal-weight actions.

## Invoice Detail Reference Direction

The Invoice detail screen should eventually use this hierarchy:

1. breadcrumb
2. Invoice number / Draft label + status
3. Customer + issued context
4. financial metrics:
   - Invoice total
   - Paid
   - Outstanding
5. Invoice metadata and Jobs
6. Invoice Items
7. Payments
8. destructive lifecycle action such as Void Invoice separated from routine actions

The overall layout should remain stable across Draft, Issued, and Voided states. Controls change according to state; the entire information architecture should not jump around.

## Responsive Behaviour

Desktop is the primary working environment, but layouts must remain usable on smaller screens.

At narrower widths:

- sidebar may collapse using the existing project approach or a later dedicated responsive pass
- multi-column cards collapse to one column
- tables may become horizontally scrollable or use a compact stacked representation when necessary
- action groups may wrap

Do not sacrifice desktop information density merely to avoid thinking about responsive tables.

## Accessibility

Maintain accessible contrast.

Do not communicate status solely by colour.

Keep native semantics for forms and tables where practical.

Interactive rows/controls must retain visible keyboard focus states.

Buttons and links should remain distinguishable by role and semantics.

## Implementation Strategy

Do not redesign the entire application in one unreviewable change.

Phase the migration.

### Phase 1 — Foundation + Customer flow

Implement:

- shared visual tokens / global foundations using the current styling architecture
- redesigned application shell/sidebar
- shared page width / page header patterns where appropriate
- reusable button/status/table/card patterns only when justified by repeated use
- Customers list
- Create Customer
- Edit Customer
- Customer detail
- Archived Customers list/detail
- removal of State from Customer forms with server-owned `VIC` persistence

Do not redesign Jobs, Invoices, or Payments in Phase 1 except for shell-level changes that naturally affect every page.

### Phase 2 — Dashboard + operational/financial screens

After Phase 1 is reviewed and accepted, migrate the Dashboard first using the approved Dashboard references, then migrate:

- Jobs
- Invoices
- Payments

using the patterns established in Phase 1.

## Scope Discipline

During UX migration:

- preserve existing domain behaviour
- preserve routes unless UX genuinely requires a routing change
- preserve authorization behaviour
- do not rewrite server feature logic merely to restyle a page
- do not introduce a third-party design system or CSS framework without explicit approval
- do not invent Settings or Log out functionality
- do not invent new business features
- avoid one-off page styling that conflicts with this design direction
