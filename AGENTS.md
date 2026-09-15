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

If existing code conflicts with assumptions in a task prompt, inspect the repository and follow the established project conventions unless the task explicitly requires changing them.

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

Do not introduce infrastructure, frameworks, packages, or architectural layers unless they are clearly required by the task.

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
- generic repository layers without a demonstrated need
- service locators
- global dependency containers
- unnecessary inheritance
- generic CRUD frameworks
- premature state machines
- excessive indirection
- unnecessary wrapper functions
- unrelated cleanup while implementing a feature

A small amount of duplication is preferable to a premature abstraction.

Refactor only when the task requires it or when a very small local refactor is necessary to implement the requested behaviour cleanly.

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
create-job-input.ts
validate-create-job.ts
job-status.ts
get-active-jobs.ts
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

unless the contents genuinely represent one cohesive concept and the existing repository already uses that convention.

Do not introduce classes merely to create "services".

Functions are preferred when they clearly express the operation.

---

# Queries

Queries should live near the server feature that owns the read behaviour.

For example:

```text
app/server/features/jobs/queries/get-active-jobs.ts
```

Queries should return data shaped appropriately for their caller.

Do not force routes or UI code to reconstruct domain state from raw database rows when the server query can express it clearly.

Avoid generic repository abstractions.

Cross-feature reads are acceptable when they are simple and intentional. Do not create a generic data-access layer solely to prevent one feature from reading data owned by another feature.

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

For example:

```text
app/ui/features/jobs/
├── pages/
└── components/
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

Example:

```text
app/ui/features/jobs/components/job-list/
├── job-list.tsx
└── job-list.module.css
```

Do not extract trivial components merely to reduce line count.

Create a component when it represents a meaningful UI concept, has reusable behaviour, or materially improves readability.

---

# Component Props

Component prop types should normally be defined in the same file as the component that consumes them.

For example:

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

Use CSS Modules following the existing project conventions.

CSS should be co-located with the page, component, or layout that owns it.

Example:

```text
job-list.tsx
job-list.module.css
```

Avoid feature-wide CSS dumping grounds.

Do not move unrelated styles while implementing a feature.

Reuse existing design patterns and visual conventions before inventing new ones.

The UI should remain consistent with the existing Customers feature.

---

# Types

Use TypeScript strict mode correctly.

Do not weaken types to make implementation easier.

Avoid:

```ts
any;
```

unless interoperability genuinely requires it and the use is narrowly contained.

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
- client-side status values
- user role information supplied by the browser

Business invariants must be enforced on the server.

---

# Authentication and Authorization

Cloudflare Access provides authentication using Google as the sole identity provider.

Application users are stored internally in D1.

Internal users currently have:

- admin
- operator

roles.

Follow the existing authentication and authorization helpers and patterns.

Do not duplicate Access parsing or authorization logic when established helpers already exist.

All protected loaders and actions must enforce the appropriate authentication and authorization requirements server-side.

Do not rely on hiding UI controls as authorization.

---

# Database and Drizzle

Use the existing D1 and Drizzle conventions.

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

Archived customers may later be restored.

Customer operations currently include:

- active customer list
- create customer
- customer detail
- edit customer
- archive customer
- archived customer list
- restore customer

New behaviour must preserve these semantics.

Do not introduce hard-delete customer behaviour.

---

# Jobs Domain Rules

Jobs preserve status history.

Do not model job status solely as a mutable field whose previous values are discarded.

The status-history records are the authoritative history of job state.

The current status should be determined from the latest applicable status-history record unless a later deliberate architectural decision introduces a safe derived/cache representation.

Do not introduce both:

```text
jobs.status
```

and:

```text
job_status_history
```

as competing sources of truth.

For the initial Jobs implementation, supported status values are:

```text
scheduled
completed
cancelled
```

The first Jobs vertical slice creates only `scheduled` jobs.

Creating a Job must also create its initial `scheduled` status-history entry.

These writes must occur in the same transaction.

A Job must never be successfully created without its initial status-history row.

Job status-history entries should record the internal Seymour user responsible for the change.

Only active customers may be selected when creating a new Job.

The initial active Jobs list consists of Jobs whose current status is `scheduled`.

Do not introduce a generic workflow engine or state-machine abstraction for Jobs at this stage.

Status-transition behaviour should be implemented incrementally as product requirements are added.

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

These rules must be preserved when invoice functionality is implemented or modified.

---

# Payment Domain Rules

A Payment belongs to exactly one Invoice.

An Invoice may have multiple Payments.

Overpayments are not allowed.

Incorrect Payments are voided rather than destructively altered or deleted in a way that destroys their history.

Invoice balances are derived from invoice and payment data.

Do not introduce a mutable balance field as an independent source of truth without an explicit architectural decision requiring it.

---

# Testing

Tests structurally mirror production code under:

```text
tests/app/
```

For example:

```text
app/server/features/jobs/create-job.ts
```

should normally have its corresponding test near:

```text
tests/app/server/features/jobs/create-job.test.ts
```

and:

```text
app/server/features/jobs/queries/get-active-jobs.ts
```

should normally map to:

```text
tests/app/server/features/jobs/queries/get-active-jobs.test.ts
```

Follow existing route-test conventions for files under `app/routes/`.

Tests should focus on behaviour and business invariants.

Do not duplicate implementation details unnecessarily.

High-value tests include:

- validation boundaries
- authorization
- domain invariants
- transactional behaviour
- status-history behaviour
- query filtering
- predictable ordering
- failure cases that could otherwise create inconsistent state

Avoid broad snapshot tests when focused behavioural assertions are clearer.

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

For example, when implementing the initial Jobs slice, do not also add:

- Job detail
- Job editing
- rescheduling
- completion UI
- cancellation UI
- reopening
- recurring Jobs
- Job items
- pricing
- invoice generation
- operator assignment
- calendar views
- notes
- generic status-transition engines

unless explicitly requested.

---

# File Creation

Before creating a file, ask:

1. Does this represent one meaningful concept?
2. Does an existing file already own this responsibility?
3. Is this abstraction required now?
4. Does its location match the repository architecture?

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
5. Confirm new server mutations validate input.
6. Confirm authorization is enforced server-side.
7. Confirm database operations preserve domain invariants.
8. Confirm tests mirror the production structure.
9. Confirm new UI follows the existing Customers visual and structural conventions.
10. Confirm no unnecessary abstractions were introduced.

Report:

- what changed
- important design decisions
- tests/checks run
- any assumptions or limitations

Do not claim a test or check passed unless it was actually run successfully.
