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

Field            Scheduled     In Progress     Completed     Cancelled

name             editable      editable        editable      editable

description      editable      editable        editable      editable

scheduled date   editable      read-only       read-only     read-only

customer         immutable     immutable       immutable     immutable

status           lifecycle     lifecycle       lifecycle     lifecycle

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

# Job Item Domain Rules

Job Items represent work performed or charges recorded against a Job.

Job Items are operational Job data.

They are distinct from Invoice Items.

Current Job Item fields are:

```text
description
amountCents
```

Money must be stored as integer cents.

Do not store Job Item monetary values as floating-point dollars.

A Job Item amount may be zero.

Negative Job Item amounts are not currently supported.

Do not introduce discounts or negative line items without an explicit later product decision.

A Job may have zero or more Job Items.

The Job total is derived from its Job Items.

Do not introduce a mutable stored Job-total field as a separate source of truth.

The current Job total is:

```text
sum(job_items.amount_cents)
```

Job Items may currently be:

- added
- edited
- removed

These operations are allowed regardless of the Job's current operational status:

```text
scheduled
in_progress
completed
cancelled
```

Do not freeze Job Items merely because a Job is completed.

A completed Job may still require pricing to be entered or corrected after the operational work is finished.

A cancelled Job may still require legitimate charges such as a call-out fee or partial work charge.

Job operational status and Job pricing are separate concerns.

Do not introduce additional Job statuses such as:

```text
priced
ready_for_invoice
```

unless explicitly required by a later product decision.

Job Item mutations must require the existing Job management permission.

Authorization must be enforced server-side.

Do not rely on hiding Job Item controls in the UI as authorization.

When addressing a Job Item through a nested route, both:

```text
jobId
itemId
```

must identify the same stored Job Item.

Do not allow a Job Item belonging to one Job to be read, updated, or removed through another Job's route.

Current Job Item routes are conceptually:

```text
GET/POST /jobs/:jobId/items/new
GET/POST /jobs/:jobId/items/:itemId/edit
POST     /jobs/:jobId/items/:itemId/delete
```

Prefer explicit operations such as:

```text
createJobItem
updateJobItem
deleteJobItem
```

rather than a generic Job Item mutation API.

Removing a Job Item currently performs a real deletion.

This is intentional for the current Job Item model because Job Items remain mutable operational pricing data before invoicing establishes a financial snapshot.

This deletion rule does not apply to issued Invoice Items.

When Invoice functionality is implemented, Invoice Items must be separate records from Job Items.

Creating or issuing an Invoice from a Job must copy the relevant pricing information into Invoice Items.

Issued Invoice Items must not remain mutable projections of Job Items.

Later changes to Job Items must not modify an already-issued Invoice or its Invoice Items.

Job Item behaviour should be covered by focused tests including:

- creation
- validation
- integer-cent storage
- zero-value items
- listing and ordering
- derived Job totals
- editing
- removal
- authorization
- nested Job/Item ownership
- behaviour across scheduled, in-progress, completed, and cancelled Jobs

---

# Invoice Domain Rules

Invoices are financial snapshots built from one or more Jobs.

Invoice Items are distinct records from Job Items.

Do not model Invoice Items as mutable projections of Job Items.

Changes to Job Items after they have been snapshotted must not automatically alter existing Invoice Items.

Money must be stored as integer cents.

Do not store Invoice monetary values as floating-point dollars.

Pricing is GST-inclusive.

The Invoice total is derived from its Invoice Items.

Do not introduce a mutable stored Invoice-total field as an independent source of truth.

The current Invoice total is conceptually:

```text
sum(invoice_items.amount_cents)
```

---

## Invoice Statuses and Lifecycle

Current Invoice statuses are:

```text
draft
issued
voided
```

A draft Invoice:

- has `invoiceNumber = null`
- has `issuedAt = null`
- may be edited
- may be deleted
- may change its selected Jobs
- may have its Invoice Items added, edited, or removed

An issued Invoice:

- has an allocated Invoice number
- has `issuedAt` populated
- is immutable
- must not be deleted
- may be voided

A voided Invoice:

- retains its Invoice number
- retains its original issue information
- retains its Invoice Items and historical Job associations
- is immutable
- must not be deleted

There is currently no operation to return an issued or voided Invoice to draft.

There is currently no general Invoice reopen operation.

Do not introduce arbitrary client-controlled Invoice status mutation.

Prefer explicit business operations such as:

```text
issueInvoice
voidInvoice
deleteDraftInvoice
```

Issued and voided Invoice data must remain historical financial records.

---

## Invoice Numbering

Draft Invoices do not have Invoice numbers.

An Invoice number is allocated only when a draft is successfully issued.

The current format is:

```text
INV-000001
INV-000002
INV-000003
```

Invoice numbers must never be reused.

Voiding an Invoice does not free or recycle its number.

Deleting a draft does not consume an Invoice number because drafts have no number.

Do not allocate Invoice numbers in the browser or trust a browser-submitted Invoice number.

Number allocation is a server-side concern.

---

## Multi-Job Invoices

An Invoice may contain one or more Jobs.

All Jobs on one Invoice must belong to the same Customer.

The Invoice Customer is derived from the selected Jobs.

Do not trust a browser-submitted `customerId` when creating or changing an Invoice's Job selection.

The server must validate that all selected Jobs exist and belong to one Customer.

The relationship between Invoices and Jobs is stored explicitly through `invoice_jobs`.

A Job may not belong to more than one active Invoice at the same time.

For this rule, active Invoice associations are those whose `invoice_jobs.released_at` is null.

Draft and issued Invoices hold active Job associations.

When an issued Invoice is voided, its historical `invoice_jobs` rows are preserved and their `releasedAt` value is populated.

A released Job may then be invoiced again.

Deleting a draft removes its `invoice_jobs` rows and releases those Jobs.

The database should reinforce the single-active-Invoice-per-Job invariant using the existing partial unique index on active `invoice_jobs` rows.

Do not weaken this invariant to make UI flows easier.

---

## Creating Draft Invoices

The primary creation flow is conceptually:

```text
/invoices/new
-> choose Customer in the UI
-> choose one or more eligible Jobs for that Customer
-> create draft
-> redirect to /invoices/:invoiceId
```

The Customer selector is a UI convenience only.

The mutation should submit selected Job ids and derive the Customer server-side.

A Job-detail shortcut may navigate to:

```text
/invoices/new?jobId=<jobId>
```

This preselects an eligible Job but does not bypass server validation.

Do not create an Invoice immediately from a Job-detail POST simply because the shortcut originates from a Job.

Current Invoice creation does not impose a Job-status restriction.

Do not silently restrict invoicing to completed Jobs unless a later product decision explicitly adds that rule.

When a draft Invoice is created, current Job Items for all selected Jobs are snapshotted into Invoice Items.

Each Invoice Item records its source Job using `jobId`.

Invoice Items intentionally do not currently store `jobItemId`.

---

## Editing a Draft Invoice's Job Selection

Only draft Invoices may change their selected Jobs.

Issued and voided Invoices must reject this operation server-side.

The Customer of an existing Invoice does not change during draft Job-selection editing.

Newly selected Jobs must belong to the existing Invoice Customer.

Jobs assigned to another active Invoice must be rejected.

When editing a draft's Job selection:

- Jobs that remain selected keep their existing Invoice Items unchanged.
- Removing a Job removes that Job's Invoice Items from the draft.
- Removing a Job removes that Invoice's active `invoice_jobs` association for the Job.
- A removed Job becomes available for another active Invoice.
- Adding a Job creates a new active `invoice_jobs` association.
- Adding a Job snapshots that Job's current Job Items into new Invoice Items.

Do not rebuild or refresh Invoice Items for Jobs that remain selected.

This preservation rule is important because draft Invoice Items may themselves be edited.

A no-op Job-selection update should not destroy or regenerate Invoice Items.

---

## Draft Invoice Item Rules

Invoice Items belong to an Invoice and carry Job context through `jobId`.

Current Invoice Item fields are conceptually:

```text
invoiceId
jobId
description
amountCents
```

Invoice Items do not currently contain `jobItemId`.

A draft Invoice may have its Invoice Items:

- added
- edited
- removed

Issued and voided Invoice Items are immutable.

All Invoice Item mutations must enforce `invoices.manage` server-side.

For a nested Invoice Item route, both:

```text
invoiceId
itemId
```

must identify the same stored Invoice Item.

Do not allow an Invoice Item belonging to one Invoice to be edited or removed through another Invoice's route.

A newly added Invoice Item must belong to one of the Jobs currently selected on that draft Invoice.

Do not accept an arbitrary `jobId` that is not an active Job association for that Invoice.

For an existing Invoice Item, its `jobId` is source context and should remain immutable through normal Invoice Item editing.

Normal Invoice Item editing should change only fields it is allowed to modify, currently:

```text
description
amountCents
```

Invoice Item amounts may be zero.

Negative Invoice Item amounts are not currently supported.

Do not introduce discounts or negative Invoice Items without a later explicit product decision.

Removing an Invoice Item from a draft currently performs a real deletion.

That deletion rule applies only to mutable draft Invoice Items.

It must never be used to erase line items from issued or voided Invoices.

When a Job is removed from a draft Invoice, all Invoice Items carrying that Job's `jobId` are removed with it, including Invoice Items that were manually added or edited on the draft.

Current conceptual routes for draft Invoice Item maintenance are:

```text
GET/POST /invoices/:invoiceId/items/new
GET/POST /invoices/:invoiceId/items/:itemId/edit
POST     /invoices/:invoiceId/items/:itemId/delete
```

Prefer explicit operations such as:

```text
createInvoiceItem
updateInvoiceItem
deleteInvoiceItem
```

rather than a generic Invoice mutation endpoint.

---

## Invoice Queries and UI

The main Invoice list is:

```text
/invoices
```

Invoice creation is:

```text
/invoices/new
```

Invoice detail is:

```text
/invoices/:invoiceId
```

Draft Job-selection editing is:

```text
/invoices/:invoiceId/edit
```

Invoice detail should show:

- Invoice number or Draft label
- status
- Customer
- selected Jobs
- Invoice Items grouped by Job where useful
- derived total
- lifecycle actions appropriate to status and permission

Draft lifecycle controls may include:

```text
Issue invoice
Edit draft
Delete draft
```

Issued lifecycle controls may include:

```text
Void invoice
```

Voided Invoices have no mutation controls under the current rules.

Hiding controls in the UI is not authorization.

The server must independently enforce state and permission rules.

---

## Invoice Lifecycle Routes

Prefer dedicated action routes for lifecycle operations:

```text
POST /invoices/:invoiceId/issue
POST /invoices/:invoiceId/void
POST /invoices/:invoiceId/delete
```

Routes remain thin adapters.

Known domain errors should be mapped consistently to the project's existing HTTP response patterns, including:

- not found
- permission denied
- invalid state/conflict
- invalid Job selection
- active Invoice Job conflict

Do not duplicate lifecycle business rules inside route modules or UI components.

---

# Payment Domain Rules

A Payment belongs to exactly one Invoice.

An Invoice may have multiple Payments.

Payments are financial history. Once recorded, a Payment is not edited in place or hard-deleted.

Incorrect Payments are voided so the original record remains auditable.

For the current Payment slice, keep the model deliberately small. Conceptually a Payment contains:

```text
id
invoiceId
amountCents
receivedAt
voidedAt
createdAt
```

Do not add payment methods, transaction references, notes, allocations across multiple Invoices, refunds, or external payment-provider integration unless a later task explicitly requires them.

Money must be stored as integer cents.

A recorded Payment amount must be greater than zero.

Negative and zero-value Payments are not valid Payment records.

A new Payment may only be recorded against an issued Invoice.

Do not allow new Payments on draft or voided Invoices.

The server must enforce Invoice status; hiding controls in the UI is insufficient.

The current Payment received timestamp is assigned server-side when the Payment is recorded. Do not trust a browser-supplied accounting timestamp unless a later product decision adds editable payment dates.

A Payment may be voided only once.

Voiding a Payment preserves:

- its id
- Invoice relationship
- original amount
- original received timestamp
- original creation information

Voiding populates `voidedAt`; it does not rewrite the original Payment amount.

Do not hard-delete Payment history.

An active Payment is a Payment whose `voidedAt` is null.

Only active Payments contribute to the amount paid.

The amount paid is conceptually:

```text
sum(payments.amount_cents where voided_at is null)
```

The Invoice balance is derived from the Invoice total and active Payments:

```text
balanceCents = invoiceTotalCents - activePaymentTotalCents
```

Do not introduce mutable stored `paid` or `balance` fields as independent sources of truth.

Overpayments are not allowed.

When recording a Payment, the server must reject any amount that would make active Payments exceed the current Invoice total.

The overpayment rule must be enforced in the server feature layer and should be implemented atomically enough that concurrent Payment creation cannot knowingly violate the invariant. Follow the repository's existing D1/Drizzle transaction or batch conventions rather than adding a new persistence abstraction.

Current Payment operations should be explicit, for example:

```text
recordPayment
voidPayment
```

Do not create a generic Payment mutation endpoint that accepts an arbitrary operation or status from the browser.

Current conceptual routes are:

```text
GET/POST /invoices/:invoiceId/payments/new
POST     /invoices/:invoiceId/payments/:paymentId/void
```

For nested Payment routes, both:

```text
invoiceId
paymentId
```

must identify the same stored Payment.

Do not allow a Payment belonging to one Invoice to be voided through another Invoice's route.

Payment mutations require the existing Invoice management permission unless the repository already defines a more specific Payment permission. Do not invent a new permission solely for this slice.

Invoice detail should display Payment history and derived totals. A manageable issued Invoice with remaining balance may expose a `Record payment` action. Active Payments may expose a `Void payment` action where permitted. Draft Invoices do not expose Payment mutation controls.

Do not change the existing Invoice-void lifecycle semantics as part of the first Payment slice unless required to make the implementation internally consistent. If an interaction between Invoice voiding and existing Payments is not already specified in code or tests, preserve current Invoice behaviour and call the limitation out rather than inventing broader accounting rules.

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

## Invoice Testing

Invoice behaviour should be covered with focused tests for:

- draft creation from one Job
- draft creation from multiple same-Customer Jobs
- mixed-Customer selection rejection
- missing and duplicate Job ids
- active-Invoice Job conflicts
- Invoice Item snapshot creation
- derived totals
- draft numbering remaining null
- sequential number allocation on issue
- number preservation on void
- issued Invoice immutability
- voided Invoice immutability
- draft deletion
- Job release after void
- Job release after draft deletion
- Job-detail Invoice shortcut eligibility
- draft Job-selection add/remove behaviour
- preservation of Invoice Items for retained Jobs
- snapshotting of current Job Items only for newly-added Jobs
- removal of Invoice Items when their Job is removed from a draft
- draft Invoice Item add/edit/remove
- Invoice Item amount validation including zero and negative values
- nested Invoice/Item ownership
- Invoice Item Job membership validation
- authorization for Invoice reads and mutations
- route status/redirect behaviour
- lifecycle controls rendered only for appropriate statuses and permissions

When testing returned route action data, remember React Router actions may return either a `Response` or data-with-response-init. Narrow the result before accessing `.data` when TypeScript requires it.

## Payment Testing

Payment behaviour should be covered with focused tests for:

- recording a positive Payment on an issued Invoice
- rejecting Payments on draft Invoices
- rejecting Payments on voided Invoices
- rejecting zero and negative amounts
- rejecting overpayments
- allowing multiple Payments up to exactly the Invoice total
- derived active amount paid
- derived remaining balance
- voiding a Payment
- voided Payments no longer contributing to amount paid
- preserving voided Payment history
- rejecting repeated Payment voids
- nested Invoice/Payment ownership
- authorization
- route validation/status/redirect behaviour
- Payment controls rendered only for appropriate Invoice states and permissions

For Drizzle `INSERT ... SELECT`, raw SQL expressions selected into inserted columns must be assigned aliases when required by Drizzle's type system.

Use imported Drizzle predicates such as `eq(...)` in `.where(...)`; do not use unsupported callback-style predicates.

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

19. Confirm draft Invoices have no Invoice number and numbers are allocated only on issue.

20. Confirm one Job cannot belong to more than one active Invoice.

21. Confirm all Jobs on one Invoice belong to the same Customer.

22. Confirm issued and voided Invoices and Invoice Items are immutable.

23. Confirm voiding preserves historical Invoice/Job associations while releasing Jobs for reinvoicing.

24. Confirm changing a draft's Job selection preserves Invoice Items for retained Jobs, removes items for removed Jobs, and snapshots only newly-added Jobs.

25. Confirm any Invoice Item mutation is limited to draft Invoices and enforces nested Invoice/Item ownership.

Report:

- what changed

- important design decisions

- tests/checks run

- any assumptions or limitations

Do not claim a test or check passed unless it was actually run successfully.
