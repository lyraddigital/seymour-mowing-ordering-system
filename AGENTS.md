# Seymour Mowing Ordering System — Agent Instructions

## Purpose

This repository contains the Seymour Mowing Ordering System.

When making changes:

- Preserve the existing architecture.
- Prefer small, reviewable changes.
- Follow existing patterns before introducing new ones.
- Avoid unrelated refactors.
- Keep implementation explicit, readable, and boring.
- Use pragmatic SOLID principles.
- Avoid abstraction for abstraction's sake.
- Read this file before making changes.

If existing code conflicts with assumptions in a task prompt, inspect the repository and follow established project conventions unless the task explicitly requires changing them.

---

# Technology Stack

The application uses:

- Cloudflare Workers
- React Router Framework Mode with SSR
- TypeScript with strict mode
- Cloudflare D1
- Drizzle ORM
- Cloudflare Access
- Google as the sole Cloudflare Access identity provider
- Vitest and the project's existing test infrastructure

Staging and production are deployed independently.

Production deployment requires approval.

Do not introduce infrastructure, frameworks, packages, or architectural layers unless clearly required by the task.

---

# General Engineering Principles

Prefer:

- simple code
- explicit dependencies
- small functions with clear responsibilities
- feature-local code
- domain-specific names
- predictable control flow
- narrow interfaces
- server-side validation
- database constraints where appropriate
- transactions where multiple writes form one business operation

Avoid:

- speculative abstractions
- generic repository layers without demonstrated need
- service locators
- global dependency containers
- unnecessary inheritance
- generic CRUD frameworks
- premature state machines
- excessive indirection
- unnecessary wrapper functions
- unrelated cleanup while implementing a feature

A small amount of duplication is preferable to premature abstraction.

Refactor only when required by the task or when a small local refactor is necessary to implement requested behaviour cleanly.

---

# Application Architecture

## Routes

React Router route modules live under:

```text
app/routes/
```

Routes are thin adapters/controllers.

A route may:

- authenticate the request
- authorize the user
- parse route parameters
- parse submitted form data
- call server feature functions
- map known server results to HTTP responses
- redirect
- provide loader/action data to presentation components

Routes should not contain substantial business logic.

Do not place database queries directly in route modules when the logic belongs to a server feature.

Do not turn route modules into large page components.

Where one route action represents one specific business operation, prefer a dedicated route/action rather than a generic action that dispatches based on a value supplied by the client.

For example, prefer:

```text
POST /jobs/:jobId/start
POST /jobs/:jobId/complete
POST /jobs/:jobId/cancel
```

over a single generic status route accepting a client-supplied target status.

---

# Server Features

Server-side feature logic lives under:

```text
app/server/features/<feature>/
```

Examples:

```text
app/server/features/customers/
app/server/features/jobs/
```

Feature code should use domain-specific files.

Prefer one meaningful concept per file.

Good examples:

```text
create-job.ts
update-job.ts
start-job.ts
complete-job.ts
cancel-job.ts
create-job-input.ts
update-job-input.ts
validate-create-job.ts
validate-update-job.ts
job-status.ts
get-active-jobs.ts
get-job-history.ts
archive-customer.ts
```

Avoid catch-all files such as:

```text
types.ts
utils.ts
helpers.ts
models.ts
services.ts
common.ts
```

unless the contents genuinely represent one cohesive concept and the repository already uses that convention.

Do not introduce classes merely to create "services".

Functions are preferred when they clearly express the operation.

---

# Queries

Queries should live near the server feature that owns the read behaviour.

For example:

```text
app/server/features/jobs/queries/get-active-jobs.ts
app/server/features/jobs/queries/get-job-history.ts
```

Queries should return data shaped appropriately for their caller.

Do not force routes or UI code to reconstruct domain state from raw database rows when the server query can express it clearly.

Avoid generic repository abstractions.

Cross-feature reads are acceptable when simple and intentional.

Do not create a generic data-access layer solely to prevent one feature from reading data owned by another feature.

Reuse an existing query when it already expresses the required behaviour cleanly.

---

# UI Architecture

Feature UI lives under:

```text
app/ui/features/<feature>/
```

Feature UI is separated into:

```text
pages/
components/
```

## Pages

Route-level page components belong under:

```text
app/ui/features/<feature>/pages/
```

Route-level page components must not be placed under `components/`.

Meaningful pages should own their own folder.

Example:

```text
app/ui/features/jobs/pages/jobs-page/
├── jobs-page.tsx
└── jobs-page.module.css
```

## Components

Reusable or meaningful feature components belong under:

```text
app/ui/features/<feature>/components/
```

Meaningful components should normally own their own folder.

Do not extract trivial components merely to reduce line count.

Create a component when it represents a meaningful UI concept, has reusable behaviour, or materially improves readability.

If an active Job row/card gains several meaningful actions and the existing list component becomes unwieldy, extracting a Job list item component is acceptable.

Do not force such extraction prematurely.

---

# Component Props

Component prop types should normally be defined in the same file as the component that consumes them.

Example:

```tsx
interface JobListProps {
  jobs: JobListItem[];
}

export function JobList({ jobs }: JobListProps) {
  // ...
}
```

Do not create a separate file solely for a component's props.

A type should have its own file only when it represents a meaningful shared or domain concept independent of one component.

---

# CSS

Use CSS Modules following existing project conventions.

CSS should be co-located with the page, component, or layout that owns it.

Example:

```text
job-list.tsx
job-list.module.css
```

Avoid feature-wide CSS dumping grounds.

Do not move unrelated styles while implementing a feature.

Reuse existing design patterns and visual conventions before inventing new ones.

The UI should remain consistent with the existing Customers and Jobs features.

---

# Types

Use TypeScript strict mode correctly.

Do not weaken types to make implementation easier.

Avoid `any` unless interoperability genuinely requires it and use is narrowly contained.

Prefer domain-specific types with meaningful names.

Do not create catch-all `types.ts` files.

Types used only by one component should usually remain with that component.

Types representing a meaningful server/domain concept may have their own file.

Do not duplicate a type if Drizzle or another authoritative project source already provides the appropriate type cleanly.

---

# Validation

All mutation inputs must be validated on the server.

Client-side validation may improve UX but is not a substitute for server-side validation.

Validation behaviour should be explicit and testable.

Do not trust:

- form data
- route parameters
- foreign-key identifiers supplied by the browser
- status values supplied by the browser
- return destinations supplied by the browser
- user role information supplied by the browser

Business invariants must be enforced on the server.

The server should determine the resulting status for explicit business actions such as starting, completing, or cancelling a Job.

Do not accept arbitrary target status values from the client for those operations.

If a browser-provided return destination is supported, it must be restricted to known safe application destinations rather than treated as an arbitrary redirect URL.

---

# Authentication and Authorization

Cloudflare Access provides authentication using Google as the sole identity provider.

Application users are stored internally in D1.

Internal users currently have:

- admin
- operator

roles.

Follow existing authentication and authorization helpers and patterns.

Do not duplicate Access parsing or authorization logic when established helpers already exist.

All protected loaders and actions must enforce appropriate authentication and authorization server-side.

Do not rely on hiding UI controls as authorization.

---

# Database and Drizzle

Use existing D1 and Drizzle conventions.

Before adding schema code:

- inspect the existing schema layout
- follow the existing identifier strategy
- follow existing timestamp conventions
- follow existing foreign-key conventions
- follow existing migration conventions

Do not reorganize the database layer as part of an unrelated feature.

Do not manually choose a migration numbering scheme that conflicts with the project's existing Drizzle workflow.

Use database constraints where they reinforce meaningful invariants.

Add indexes where required by known query patterns, not speculatively.

---

# Transactions

Use a transaction when multiple writes together represent one business operation.

The operation should either succeed completely or leave the database unchanged.

Do not leave partially-created domain state.

For example, creating a Job and creating its initial Job status-history row are one operation and must be atomic.

---

# Customers Domain Rules

Customers are never hard-deleted.

Customers may be:

- active
- archived

Archived Customers may later be restored.

Current Customer operations include:

- active Customer list
- create Customer
- Customer detail
- edit Customer
- archive Customer
- archived Customer list
- restore Customer

New behaviour must preserve these semantics.

Do not introduce hard-delete Customer behaviour.

---

# Jobs Domain Rules

Jobs preserve status history.

Do not model Job status solely as a mutable field whose previous values are discarded.

Job status-history records are the authoritative history of Job state.

The current Job status is determined from the latest applicable status-history record.

Do not introduce both:

```text
jobs.status
```

and:

```text
job_status_history
```

as competing sources of truth.

Current Job statuses are:

```text
scheduled
in_progress
completed
cancelled
```

Creating a Job:

- requires an active Customer
- creates the Job
- creates an initial `scheduled` status-history entry
- records the responsible internal Seymour user
- performs Job creation and initial history creation atomically

A Job must never be successfully created without its initial status-history record.

---

# Job Naming and Description

Jobs have a required human-readable name.

The Job name is distinct from the Job description.

Example:

```text
Name:
Front & Back Lawn Mow

Description:
Mow front and back lawns, edge driveway and blow clippings from paths.
```

The Job is the primary entity in Jobs UI.

The Job name should normally be the focal identifier and link to the Job detail page.

The Customer remains important contextual information and may link to the Customer record, but should not replace the Job as the primary UI concept.

Job name and description are descriptive metadata.

They may be edited regardless of current Job status:

```text
scheduled
in_progress
completed
cancelled
```

This allows corrections and clarification of the Job record without altering its lifecycle history.

Editing Job name or description must not create or modify Job status-history rows.

---

# Job Customer Immutability

The Customer associated with a Job is set when the Job is created and is immutable afterwards.

Do not provide a general edit operation for:

```text
customer_id
```

Do not include `customerId` in Job update input types or edit forms.

Do not allow a browser-submitted Customer id to alter an existing Job's Customer.

If a Job was created for the wrong Customer, the required correction workflow is:

```text
1. Cancel the incorrect Job.
2. Create a new Job for the correct Customer.
```

This is intentional.

Do not introduce a "Change Customer", "Reassign Customer", or equivalent operation unless explicitly requested by a later product decision.

The Customer relationship is considered part of the Job's identity and historical integrity.

---

# Scheduled Date Editing

A Job's scheduled date may be changed only while the authoritative current status is:

```text
scheduled
```

Once the Job leaves the scheduled phase, its scheduled date becomes immutable.

Therefore:

```text
scheduled:
  scheduled date editable

in_progress:
  scheduled date read-only

completed:
  scheduled date read-only

cancelled:
  scheduled date read-only
```

This rule must be enforced server-side.

Do not rely solely on disabling or hiding the field in the UI.

When updating a Job whose current status is not `scheduled`, name and description may still be changed, but the scheduled date must remain unchanged.

If the edit form includes the existing scheduled date as a submitted value, do not reject an otherwise valid metadata edit merely because the field is present.

Reject the operation only if a non-scheduled Job attempts to change the stored scheduled date.

Prefer making the field disabled or read-only in the UI when the Job is not scheduled, while still enforcing the invariant on the server.

Editing a scheduled date does not itself create a Job status-history record.

---

# Job Edit Rules

The current Job edit rules are:

```text
Field            Scheduled     In Progress     Completed     Cancelled

name             editable      editable        editable      editable
description      editable      editable        editable      editable
scheduled date   editable      read-only       read-only     read-only
customer         immutable     immutable       immutable     immutable
status           lifecycle     lifecycle       lifecycle     lifecycle
```

Status is never changed through the normal Job edit form.

Status changes occur only through explicit lifecycle operations.

The Job edit operation should only accept fields it is allowed to modify.

Do not create a broad update DTO that includes immutable or lifecycle-managed fields.

---

# Job Status Transitions

Current legal transitions are:

```text
scheduled -> in_progress
scheduled -> completed
scheduled -> cancelled

in_progress -> completed
in_progress -> cancelled
```

The following are not currently valid:

```text
in_progress -> scheduled
in_progress -> in_progress

completed -> scheduled
completed -> in_progress
completed -> completed
completed -> cancelled

cancelled -> scheduled
cancelled -> in_progress
cancelled -> completed
cancelled -> cancelled
```

There is currently no reopen transition.

There is currently no transition from `in_progress` back to `scheduled`.

A scheduled Job may be completed directly without first moving to `in_progress`.

This is intentional.

Starting, completing, or cancelling a Job must append a new status-history row.

Do not mutate or delete previous status-history records.

Each new status-history row must record the internal Seymour user responsible for the transition.

Transition validity must be enforced server-side using the authoritative current status.

Do not rely on the UI hiding buttons to prevent invalid transitions.

Prefer explicit business operations such as:

```text
startJob
completeJob
cancelJob
```

over generic status-setting APIs.

Do not introduce a generic workflow engine or state-machine abstraction unless future requirements demonstrate a real need.

---

# Active Jobs and Job History

The primary Jobs list represents active operational work.

The current active statuses are:

```text
scheduled
in_progress
```

Therefore:

```text
/jobs
```

contains Jobs whose authoritative current status is either:

```text
scheduled
in_progress
```

Historical/non-active Jobs are shown separately.

The current history statuses are:

```text
completed
cancelled
```

Therefore:

```text
/jobs/history
```

contains Jobs whose authoritative current status is either:

```text
completed
cancelled
```

The latest applicable status-history record determines which list a Job belongs to.

Do not model completed or cancelled Jobs as deleted or archived merely to support this UI separation.

Completed and cancelled are Job statuses, not archival flags.

Both active and historical Jobs must continue to link to the normal Job detail page.

Do not duplicate separate Job-detail implementations for active and historical Jobs.

---

# Active Jobs Operational Actions

The active Jobs list is an operational screen, not merely a navigation index.

Common lifecycle actions should be available directly against active Jobs where appropriate.

For a Job whose current status is:

```text
scheduled
```

the active Jobs UI may expose:

```text
Start Job
Complete Job
Cancel Job
```

For a Job whose current status is:

```text
in_progress
```

the active Jobs UI may expose:

```text
Complete Job
Cancel Job
```

These actions may also remain available on the Job detail page.

Providing actions on the active list does not replace the Job detail page.

The same server-side transition operations and invariants must be used regardless of whether an action is initiated from the active Jobs list or Job detail page.

Do not duplicate transition business logic in UI components or routes.

The UI may decide which controls to show based on current status, but the server remains authoritative.

---

# Lifecycle Action Routes

Prefer one dedicated route/action per Job lifecycle operation.

Current operations are conceptually:

```text
POST /jobs/:jobId/start
POST /jobs/:jobId/complete
POST /jobs/:jobId/cancel
```

Do not replace these with a generic status endpoint controlled by a client-supplied status value.

Lifecycle routes should remain thin.

Their responsibilities are typically:

- authenticate
- authorize
- validate/read Job id
- call the relevant domain operation
- map known domain errors to the established response pattern
- redirect to the appropriate UI destination

Business transition rules belong in the server feature, not the route.

---

# Redirect Behaviour for Shared Actions

Lifecycle actions may be initiated from more than one UI surface, such as:

```text
/jobs
/jobs/:jobId
```

Do not put UI navigation concerns into `startJob`, `completeJob`, or `cancelJob`.

The route/controller layer owns redirect behaviour.

If a return destination is supplied by the client, it must be constrained to known safe application destinations.

Do not implement an open redirect using arbitrary client-provided URLs.

A small explicit destination value or route-specific behaviour is preferable to a generic redirect mechanism.

---

# Invoice Domain Rules

Invoice items are distinct from Job items.

Do not assume invoice line items remain linked mutable representations of Job items.

Issued invoices are immutable.

Issued invoice items are immutable.

Draft invoices may be deleted.

Issued invoices must not be deleted.

Issued invoices may instead be voided.

Invoice numbers are never reused.

Money must be stored as integer cents.

Do not store monetary values as floating-point dollars.

Pricing is GST-inclusive.

These rules must be preserved when Invoice functionality is implemented or modified.

---

# Payment Domain Rules

A Payment belongs to exactly one Invoice.

An Invoice may have multiple Payments.

Overpayments are not allowed.

Incorrect Payments are voided rather than destructively altered or deleted in a way that destroys history.

Invoice balances are derived from Invoice and Payment data.

Do not introduce a mutable balance field as an independent source of truth without an explicit architectural decision requiring it.

---

# Testing

Tests structurally mirror production code under:

```text
tests/app/
```

For example:

```text
app/server/features/jobs/update-job.ts
```

should normally have a corresponding test near:

```text
tests/app/server/features/jobs/update-job.test.ts
```

Follow existing route-test conventions for files under `app/routes/`.

Tests should focus on behaviour and business invariants.

Do not duplicate implementation details unnecessarily.

High-value tests include:

- validation boundaries
- authorization
- domain invariants
- immutable Customer relationship
- scheduled-date mutation rules
- metadata editing across Job statuses
- status-history behaviour
- legal and illegal status transitions
- active/history filtering based on current status
- actions exposed for the correct active states
- predictable ordering
- failure cases that could otherwise create inconsistent state

Avoid broad snapshot tests when focused behavioural assertions are clearer.

For Job editing specifically, test at minimum:

- scheduled Job name can be changed
- scheduled Job description can be changed
- scheduled Job date can be changed
- in-progress Job name can be changed
- in-progress Job description can be changed
- in-progress Job date cannot be changed
- completed Job name can be changed
- completed Job description can be changed
- completed Job date cannot be changed
- cancelled Job name can be changed
- cancelled Job description can be changed
- cancelled Job date cannot be changed
- Customer cannot be changed through the update operation
- editing metadata does not alter status history

---

# Feature Development

Develop features incrementally as vertical slices.

A good vertical slice should include only what is required to deliver one useful end-to-end behaviour.

A slice may include:

- schema/migration changes
- server feature behaviour
- query behaviour
- route adapters
- UI
- focused tests

Do not implement future slices pre-emptively.

When implementing Job editing, do not also add:

- Customer reassignment
- reopening
- moving `in_progress` back to `scheduled`
- status-history timeline UI
- Job items
- pricing
- invoice generation
- recurring Jobs
- operator assignment
- calendar views
- generic status-transition frameworks

unless explicitly requested.

---

# File Creation

Before creating a file, ask:

1. Does this represent one meaningful concept?
2. Does an existing file already own this responsibility?
3. Is this abstraction required now?
4. Does its location match repository architecture?

Do not create placeholder files for hypothetical future behaviour.

Do not create index/barrel files unless the existing repository consistently uses them and they provide actual value.

---

# Scope Discipline

Implement only the requested task.

Do not:

- rename unrelated files
- reorganize unrelated directories
- reformat large unrelated areas
- rewrite working code for personal preference
- introduce unrelated dependencies
- clean up unrelated TODOs
- alter CI or deployment workflows unless required
- change authentication architecture unless required

If a small nearby change is essential for correctness, keep it tightly scoped and explain it in the final summary.

---

# Before Finishing

Before considering work complete:

1. Review the diff for unrelated changes.
2. Run the relevant test suite.
3. Run TypeScript/type checking using the project's existing command.
4. Run linting/formatting using the project's existing commands where applicable.
5. Confirm authorization is enforced server-side.
6. Confirm Job status remains derived from status history.
7. Confirm legal transitions are enforced server-side.
8. Confirm active Jobs includes both `scheduled` and `in_progress`.
9. Confirm Job History contains `completed` and `cancelled`.
10. Confirm Customer cannot be changed after Job creation.
11. Confirm name and description remain editable for all Job statuses.
12. Confirm scheduled date can only change while the Job is `scheduled`.
13. Confirm metadata edits do not modify Job status history.
14. Confirm active-list actions use the same domain operations as detail-page actions.
15. Confirm redirect handling cannot create an open redirect.
16. Confirm tests mirror production structure.
17. Confirm new UI follows existing visual and structural conventions.
18. Confirm no unnecessary abstractions were introduced.

Report:

- what changed
- important design decisions
- tests/checks run
- any assumptions or limitations

Do not claim a test or check passed unless it was actually run successfully.
