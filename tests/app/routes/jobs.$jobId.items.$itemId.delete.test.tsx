import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import { RouterContextProvider } from "react-router";

import { action } from "../../../app/routes/jobs.$jobId.items.$itemId.delete";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { jobItems } from "../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../app/server/db/schema/jobs";
import { users } from "../../../app/server/db/schema/users";
import { createJobItem } from "../../../app/server/features/jobs/services/create-job-item.server";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();

let context: RouterContextProvider;
let jobId: string;
let itemId: string;

function actionArgs() {
  return {
    context,
    request: new Request(
      `https://example.test/jobs/${jobId}/items/${itemId}/delete`,
      {
        method: "POST",
      },
    ),
    url: new URL(`https://example.test/jobs/${jobId}/items/${itemId}/delete`),
    params: {
      jobId,
      itemId,
    },
    pattern: "/jobs/:jobId/items/:itemId/delete",
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

  context.set(currentUserContext, user);
  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  const db = createDb(env.DB);

  await db.delete(jobItems);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);

  await db.insert(users).values(user);

  await db.insert(customers).values({
    id: "customer",
    name: "John Smith",
    createdAt: 1,
    updatedAt: 1,
  });

  ({ id: jobId } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Front & Back Lawn Mow",
    description: "Mow lawns",
    scheduledDate: "2026-09-16",
  }));

  ({ id: itemId } = await createJobItem(env.DB, user, jobId, {
    description: "Front lawn",
    amountCents: 4500,
  }));
});

it("deletes the item and redirects to the job", async () => {
  const response = await action(actionArgs());

  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(302);
  expect((response as Response).headers.get("Location")).toBe(`/jobs/${jobId}`);

  expect(await createDb(env.DB).select().from(jobItems)).toEqual([]);
});

it("only deletes the requested item", async () => {
  const { id: otherItemId } = await createJobItem(env.DB, user, jobId, {
    description: "Back lawn",
    amountCents: 3500,
  });

  await action(actionArgs());

  expect(await createDb(env.DB).select().from(jobItems)).toEqual([
    expect.objectContaining({
      id: otherItemId,
      description: "Back lawn",
      amountCents: 3500,
    }),
  ]);
});

it.each(["completed", "cancelled"] as const)(
  "allows an item to be deleted from a %s job",
  async (status) => {
    await createDb(env.DB)
      .insert(jobStatusHistory)
      .values({
        id: `status-${status}`,
        jobId,
        status,
        createdByUserId: user.id,
        createdAt: Date.now() + 1,
      });

    const response = await action(actionArgs());

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(302);

    expect(await createDb(env.DB).select().from(jobItems)).toEqual([]);
  },
);

it("returns 404 for a missing item", async () => {
  itemId = "missing";

  await expectResponseStatus(action(actionArgs()), 404);
});

it("does not allow an item from another job to be deleted", async () => {
  const { id: otherJobId } = await createJob(env.DB, user, {
    customerId: "customer",
    name: "Other job",
    description: "Other work",
    scheduledDate: "2026-09-17",
  });

  jobId = otherJobId;

  await expectResponseStatus(action(actionArgs()), 404);

  expect(await createDb(env.DB).select().from(jobItems)).toHaveLength(1);
});

it("returns 403 without manage permission", async () => {
  context.set(currentUserContext, {
    ...user,
    role: "unknown" as "admin",
  });

  await expectResponseStatus(action(actionArgs()), 403);

  expect(await createDb(env.DB).select().from(jobItems)).toHaveLength(1);
});

it("requires the authenticated user context", async () => {
  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(action(actionArgs())).rejects.toThrow();
});
