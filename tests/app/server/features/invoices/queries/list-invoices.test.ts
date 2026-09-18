import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { customers } from "../../../../../../app/server/db/schema/customers";
import { invoiceItems } from "../../../../../../app/server/db/schema/invoice-items";
import { invoiceJobs } from "../../../../../../app/server/db/schema/invoice-jobs";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { jobItems } from "../../../../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { users } from "../../../../../../app/server/db/schema/users";
import { listInvoices } from "../../../../../../app/server/features/invoices/queries/list-invoices.server";
import { createDraftInvoice } from "../../../../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../../../../app/server/features/invoices/services/issue-invoice.server";
import { createJobItem } from "../../../../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../../../../support/fixtures/internal-user";

const admin = internalUser();

let firstJobId: string;
let secondJobId: string;

beforeEach(async () => {
  const db = createDb(env.DB);

  await db.delete(invoiceItems);
  await db.delete(invoiceJobs);
  await db.delete(invoices);
  await db.delete(jobItems);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);

  await db.insert(users).values(admin);

  await db.insert(customers).values({
    id: "customer",
    name: "John Smith",
    createdAt: 1,
    updatedAt: 1,
  });

  ({ id: firstJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-17",
  }));

  ({ id: secondJobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Back lawn",
    description: "Mow back lawn",
    scheduledDate: "2026-09-18",
  }));
});

it("returns invoices with customer and job context", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const result = await listInvoices(env.DB, admin);

  expect(result).toEqual([
    expect.objectContaining({
      id: invoiceId,
      customerId: "customer",
      customerName: "John Smith",
      invoiceNumber: null,
      status: "draft",
      totalCents: 0,
      jobs: [
        {
          id: firstJobId,
          name: "Front lawn",
          scheduledDate: "2026-09-17",
        },
        {
          id: secondJobId,
          name: "Back lawn",
          scheduledDate: "2026-09-18",
        },
      ],
    }),
  ]);
});

it("derives totals from invoice items across multiple jobs", async () => {
  await createJobItem(env.DB, admin, firstJobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  await createJobItem(env.DB, admin, secondJobId, {
    description: "Back lawn mow",
    amountCents: 3500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId, secondJobId],
  });

  const result = await listInvoices(env.DB, admin);

  expect(result).toEqual([
    expect.objectContaining({
      id: invoiceId,
      totalCents: 8000,
    }),
  ]);
});

it("returns issued invoice information", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  await issueInvoice(env.DB, admin, invoiceId);

  expect(await listInvoices(env.DB, admin)).toEqual([
    expect.objectContaining({
      id: invoiceId,
      invoiceNumber: "INV-000001",
      status: "issued",
      issuedAt: expect.any(Number),
    }),
  ]);
});

it("returns invoices newest first", async () => {
  const first = await createDraftInvoice(env.DB, admin, {
    jobIds: [firstJobId],
  });

  const second = await createDraftInvoice(env.DB, admin, {
    jobIds: [secondJobId],
  });

  const db = createDb(env.DB);

  await db
    .update(invoices)
    .set({
      createdAt: 100,
      updatedAt: 100,
    })
    .where(eq(invoices.id, first.id));

  await db
    .update(invoices)
    .set({
      createdAt: 200,
      updatedAt: 200,
    })
    .where(eq(invoices.id, second.id));

  const result = await listInvoices(env.DB, admin);

  expect(result.map((invoice) => invoice.id)).toEqual([second.id, first.id]);
});

it("returns an empty list when there are no invoices", async () => {
  expect(await listInvoices(env.DB, admin)).toEqual([]);
});

it("requires invoice read permission", async () => {
  await expect(
    listInvoices(env.DB, {
      ...admin,
      role: "unknown" as "admin",
    }),
  ).rejects.toBeInstanceOf(PermissionDeniedError);
});
