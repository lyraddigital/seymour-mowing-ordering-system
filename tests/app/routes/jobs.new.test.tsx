import { env } from "cloudflare:workers";
import { beforeEach, expect, it } from "vitest";
import {
  RouterContextProvider,
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { action, loader } from "../../../app/routes/jobs.new";
import { currentUserContext } from "../../../app/server/auth/context/current-user-context";
import { runtimeContext } from "../../../app/server/auth/context/runtime-context";
import { createDb } from "../../../app/server/db/client/create-db.server";
import { customers } from "../../../app/server/db/schema/customers";
import { users } from "../../../app/server/db/schema/users";
import { jobs } from "../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../app/server/db/schema/job-status-history";
import NewJobPage from "../../../app/ui/features/jobs/pages/new-job-page/new-job-page";
import { internalUser } from "../../support/fixtures/internal-user";

const user = internalUser();
let context: RouterContextProvider;
const url = "https://example.test/jobs/new";
const args = () => ({
  context,
  request: new Request(url),
  url: new URL(url),
  params: {},
  pattern: "/jobs/new",
});
const submit = (values: Record<string, string>) =>
  action({
    ...args(),
    request: new Request(url, {
      method: "POST",
      body: new URLSearchParams(values),
    }),
  });
beforeEach(async () => {
  context = new RouterContextProvider();
  context.set(currentUserContext, user);
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  const db = createDb(env.DB);
  await db.delete(jobStatusHistory);
  await db.delete(jobs);
  await db.delete(customers);
  await db.delete(users);
  await db.insert(users).values(user);
  await db.insert(customers).values([
    { id: "active", name: "Active customer", createdAt: 1, updatedAt: 1 },
    {
      id: "archived",
      name: "Archived customer",
      createdAt: 1,
      updatedAt: 1,
      archivedAt: 2,
    },
  ]);
});
it("loads only active customers for the selector", async () => {
  const result = await loader(args());
  expect(result.customers.map((customer) => customer.id)).toEqual(["active"]);
  const router = createMemoryRouter(
    [
      {
        path: "/jobs/new",
        element: <NewJobPage customers={result.customers} />,
      },
    ],
    { initialEntries: ["/jobs/new"] },
  );
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain("Active customer");
  expect(html).not.toContain("Archived customer");
  expect(html).toContain('name="scheduledDate"');
  expect(html).toContain('name="description"');
  expect(html).toContain('name="name"');
});
it("creates a scheduled job and redirects, ignoring forged user and status fields", async () => {
  const response = await submit({
    customerId: "active",
    scheduledDate: "2026-09-15",
    name: "Lawn service",
    description: "Mow lawn",
    createdByUserId: "forged",
    status: "completed",
  });
  expect(response).toBeInstanceOf(Response);
  expect((response as Response).status).toBe(302);
  expect((response as Response).headers.get("Location")).toBe("/jobs");
  expect(await createDb(env.DB).select().from(jobStatusHistory)).toMatchObject([
    { status: "scheduled", createdByUserId: user.id },
  ]);
});
it("returns and renders field errors while preserving submitted values", async () => {
  const response = await submit({
    customerId: "active",
    scheduledDate: "2026-09-15",
    name: "Lawn service",
    description: " ",
  });
  expect(response).toMatchObject({
    init: { status: 400 },
    data: {
      values: {
        customerId: "active",
        scheduledDate: "2026-09-15",
        name: "Lawn service",
        description: " ",
      },
      fieldErrors: { description: "Enter a job description." },
    },
  });
  if (response instanceof Response) throw new Error("Expected validation data");
  const router = createMemoryRouter(
    [
      {
        path: "/jobs/new",
        element: (
          <NewJobPage
            customers={(await loader(args())).customers}
            {...response.data}
          />
        ),
      },
    ],
    { initialEntries: ["/jobs/new"] },
  );
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain('role="alert"');
  expect(html).toContain('aria-describedby="description-error"');
  expect(html).toContain('value="2026-09-15"');
  expect(html).toContain('value="active" selected=""');
  expect(html).toContain("Enter a job description.");
});
it.each(["archived", "missing"])(
  "returns customer field feedback for %s selection",
  async (customerId) => {
    expect(
      await submit({
        customerId,
        scheduledDate: "2026-09-15",
        name: "Lawn service",
        description: "Mow lawn",
      }),
    ).toMatchObject({
      init: { status: 400 },
      data: { fieldErrors: { customerId: "Select an active customer." } },
    });
  },
);
it("treats missing fields as validation errors", async () => {
  expect(await submit({})).toMatchObject({
    init: { status: 400 },
    data: {
      fieldErrors: {
        name: expect.any(String),
        customerId: expect.any(String),
        scheduledDate: expect.any(String),
        description: expect.any(String),
      },
    },
  });
});
it("renders accessible name validation feedback", async () => {
  const response = await submit({
    name: " ",
    customerId: "active",
    scheduledDate: "2026-09-15",
    description: "Mow lawn",
  });
  expect(response).toMatchObject({
    init: { status: 400 },
    data: { fieldErrors: { name: "Enter a job name." } },
  });
  if (response instanceof Response) throw new Error("Expected validation data");
  const router = createMemoryRouter(
    [
      {
        path: "/jobs/new",
        element: (
          <NewJobPage
            customers={(await loader(args())).customers}
            {...response.data}
          />
        ),
      },
    ],
    { initialEntries: ["/jobs/new"] },
  );
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain('aria-describedby="name-error"');
  expect(html).toContain("Enter a job name.");
});
it("renders guidance and disables creation with no active customers", async () => {
  await createDb(env.DB).update(customers).set({ archivedAt: 3 });
  const result = await loader(args());
  const router = createMemoryRouter(
    [
      {
        path: "/jobs/new",
        element: <NewJobPage customers={result.customers} />,
      },
    ],
    { initialEntries: ["/jobs/new"] },
  );
  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  expect(html).toContain("No active customers are available.");
  expect(html).toContain('href="/customers/new"');
  expect(html).toContain('disabled=""');
});
it("denies loader and action without permission", async () => {
  context.set(currentUserContext, { ...user, role: "unknown" as "admin" });
  await expect(loader(args())).rejects.toMatchObject({ status: 403 });
  await expect(submit({})).rejects.toMatchObject({ status: 403 });
});
it("cannot run without the authenticated user context", async () => {
  context = new RouterContextProvider();
  context.set(runtimeContext, { env, ctx: {} as ExecutionContext });
  await expect(loader(args())).rejects.toThrow();
  await expect(submit({})).rejects.toThrow();
  expect(await createDb(env.DB).select().from(jobs)).toEqual([]);
});
