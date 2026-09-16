import { env } from "cloudflare:workers";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterContextProvider,
  RouterProvider,
} from "react-router";
import { beforeEach, expect, it } from "vitest";

import { action, loader } from "../../../app/routes/jobs.$jobId.items.new";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { jobItems } from "../../../app/server/db/schema/job-items";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import { jobs } from "../../../app/server/db/schema/jobs";
import { users } from "../../../app/server/db/schema/users";
import { createJob } from "../../../app/server/features/jobs/services/create-job.server";
import AddJobItemPage from "../../../app/ui/features/jobs/pages/add-job-item-page/add-job-item-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();

let context: RouterContextProvider;
let jobId: string;

function loaderArgs() {
  return {
    context,
    request: new Request(
      `https://example.test/jobs/${jobId}/items/new`,
    ),
    url: new URL(`https://example.test/jobs/${jobId}/items/new`),
    params: { jobId },
    pattern: "/jobs/:jobId/items/new",
  };
}

function actionArgs(body: URLSearchParams) {
  return {
    context,
    request: new Request(
      `https://example.test/jobs/${jobId}/items/new`,
      {
        method: "POST",
        body,
      },
    ),
    url: new URL(`https://example.test/jobs/${jobId}/items/new`),
    params: { jobId },
    pattern: "/jobs/:jobId/items/new",
  };
}

function renderPage(
  props: ComponentProps<typeof AddJobItemPage>,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/jobs/:jobId/items/new",
        element: <AddJobItemPage {...props} />,
      },
    ],
    {
      initialEntries: [`/jobs/${jobId}/items/new`],
    },
  );

  return renderToStaticMarkup(
    <RouterProvider router={router} />,
  );
}

async function expectResponseStatus(
  promise: Promise<unknown>,
  status: number,
) {
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
});

it("loads the job", async () => {
  const result = await loader(loaderArgs());

  expect(result.job).toMatchObject({
    id: jobId,
    name: "Front & Back Lawn Mow",
    customerId: "customer",
    customerName: "John Smith",
  });
});

it("renders the add item form", async () => {
  const result = await loader(loaderArgs());

  const html = renderPage({
    job: result.job,
  });

  expect(html).toContain("Add job item");
  expect(html).toContain("Front &amp; Back Lawn Mow");
  expect(html).toContain('name="description"');
  expect(html).toContain('name="amount"');
  expect(html).toContain("Add item");
  expect(html).toContain(`/jobs/${jobId}`);
});

it.each([
  ["45", 4500],
  ["45.00", 4500],
  ["45.5", 4550],
  ["0", 0],
  ["0.00", 0],
] as const)(
  "stores amount %s as %i cents",
  async (amount, expectedAmountCents) => {
    const response = await action(
      actionArgs(
        new URLSearchParams({
          description: "Front lawn",
          amount,
        }),
      ),
    );

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(302);
    expect(
      (response as Response).headers.get("Location"),
    ).toBe(`/jobs/${jobId}`);

    const items = await createDb(env.DB)
      .select()
      .from(jobItems);

    expect(items).toEqual([
      expect.objectContaining({
        jobId,
        description: "Front lawn",
        amountCents: expectedAmountCents,
      }),
    ]);
  },
);

it.each(["", "abc", "1.234", "-1", "$45.00"])(
  "returns 400 for invalid amount %j",
  async (amount) => {
    const result = await action(
      actionArgs(
        new URLSearchParams({
          description: "Front lawn",
          amount,
        }),
      ),
    );

    expect(result).toMatchObject({
      init: {
        status: 400,
      },
      data: {
        values: {
          description: "Front lawn",
          amount,
        },
      },
    });

    expect(
      await createDb(env.DB).select().from(jobItems),
    ).toEqual([]);
  },
);

it("returns 400 for a blank description", async () => {
  const result = await action(
    actionArgs(
      new URLSearchParams({
        description: " ",
        amount: "45.00",
      }),
    ),
  );

  expect(result).toMatchObject({
    init: {
      status: 400,
    },
    data: {
      values: {
        description: " ",
        amount: "45.00",
      },
    },
  });

  expect(
    await createDb(env.DB).select().from(jobItems),
  ).toEqual([]);
});

it("preserves submitted values on validation failure", async () => {
  const result = await action(
    actionArgs(
      new URLSearchParams({
        description: "Front lawn",
        amount: "invalid",
      }),
    ),
  );

  expect(result).toMatchObject({
    init: {
      status: 400,
    },
    data: {
      values: {
        description: "Front lawn",
        amount: "invalid",
      },
    },
  });
});

it.each(["completed", "cancelled"] as const)(
  "allows an item to be added to a %s job",
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

    const response = await action(
      actionArgs(
        new URLSearchParams({
          description: "Final charge",
          amount: "25.00",
        }),
      ),
    );

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(302);

    expect(
      await createDb(env.DB).select().from(jobItems),
    ).toEqual([
      expect.objectContaining({
        jobId,
        description: "Final charge",
        amountCents: 2500,
      }),
    ]);
  },
);

it("returns 404 for a missing job", async () => {
  jobId = "missing";

  await expectResponseStatus(
    loader(loaderArgs()),
    404,
  );
});

it("returns 404 when adding an item to a missing job", async () => {
  jobId = "missing";

  await expectResponseStatus(
    action(
      actionArgs(
        new URLSearchParams({
          description: "Front lawn",
          amount: "45.00",
        }),
      ),
    ),
    404,
  );
});

it("returns 403 without manage permission", async () => {
  context.set(currentUserContext, {
    ...user,
    role: "unknown" as "admin",
  });

  await expectResponseStatus(
    loader(loaderArgs()),
    403,
  );

  await expectResponseStatus(
    action(
      actionArgs(
        new URLSearchParams({
          description: "Front lawn",
          amount: "45.00",
        }),
      ),
    ),
    403,
  );
});

it("requires the authenticated user context", async () => {
  context = new RouterContextProvider();

  context.set(runtimeContext, {
    env,
    ctx: {} as ExecutionContext,
  });

  await expect(loader(loaderArgs())).rejects.toThrow();
});