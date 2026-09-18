import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { RouterContextProvider } from "react-router";
import { beforeEach, expect, it } from "vitest";

import { action } from "../../../app/routes/invoices.$invoiceId.delete";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { invoiceItems } from "../../../app/server/db/schema/invoice-items";
import { invoiceJobs } from "../../../app/server/db/schema/invoice-jobs";
import { invoices } from "../../../app/server/db/schema/invoices";
import { jobItems } from "../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../app/server/db/schema/jobs";
import { users } from "../../../app/server/db/schema/users";
import { createDraftInvoice } from "../../../app/server/features/invoices/services/create-draft-invoice.server";
import { issueInvoice } from "../../../app/server/features/invoices/services/issue-invoice.server";
import { createJobItem } from "../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../support/fixtures/internal-user";

const admin = internalUser();

let context: RouterContextProvider;
let jobId: string;

function actionArgs(invoiceId: string) {
  return {
    context,
    request: new Request(`https://example.test/invoices/${invoiceId}/delete`, {
      method: "POST",
    }),
    url: new URL(`https://example.test/invoices/${invoiceId}/delete`),
    params: {
      invoiceId,
    },
    pattern: "/invoices/:invoiceId/delete",
  };
}

async function expectResponseStatus(promise: Promise<unknown>, status: number) {
  try {
    await promise;

    throw new Error(`Expected Response with status ${status}`);
  } catch (error) {
    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(status);
  }
}

beforeEach(async () => {
  context = new RouterContextProvider();

  context.set(currentUserContext, admin);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

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

  ({ id: jobId } = await createJob(env.DB, admin, {
    customerId: "customer",
    name: "Front lawn",
    description: "Mow front lawn",
    scheduledDate: "2026-09-18",
  }));
});

it("deletes a draft invoice and redirects to invoices", async () => {
  await createJobItem(env.DB, admin, jobId, {
    description: "Front lawn mow",
    amountCents: 4500,
  });

  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  const response = await action(actionArgs(invoiceId));

  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(302);
  expect((response as Response).headers.get("Location")).toBe("/invoices");

  expect(
    await createDb(env.DB)
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId)),
  ).toEqual([]);

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceJobs)
      .where(eq(invoiceJobs.invoiceId, invoiceId)),
  ).toEqual([]);

  expect(
    await createDb(env.DB)
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId)),
  ).toEqual([]);
});

it("returns 409 when an issued invoice is deleted", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  await issueInvoice(env.DB, admin, invoiceId);

  await expectResponseStatus(action(actionArgs(invoiceId)), 409);

  expect(
    await createDb(env.DB)
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId)),
  ).toHaveLength(1);
});

it("returns 404 for a missing invoice", async () => {
  await expectResponseStatus(action(actionArgs("missing")), 404);
});

it("returns 403 without invoice management permission", async () => {
  const { id: invoiceId } = await createDraftInvoice(env.DB, admin, {
    jobIds: [jobId],
  });

  context.set(currentUserContext, {
    ...admin,
    role: "operator",
  });

  await expectResponseStatus(action(actionArgs(invoiceId)), 403);

  expect(
    await createDb(env.DB)
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId)),
  ).toHaveLength(1);
});
