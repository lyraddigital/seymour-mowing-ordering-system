import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it, vi } from "vitest";
import { getDashboard } from "../../../../../../app/server/features/dashboard/queries/get-dashboard.server";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { payments } from "../../../../../../app/server/db/schema/payments";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { issuedInvoiceFixture } from "../../../../../support/fixtures/issued-invoice";
import { draftInvoiceFixture } from "../../../../../support/fixtures/draft-invoice";
import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import * as permissions from "../../../../../../app/server/auth/authorization/policies/can";

let fixture: Awaited<ReturnType<typeof issuedInvoiceFixture>>;
const now = new Date("2026-09-22T00:00:00Z");
beforeEach(async () => {
  vi.restoreAllMocks();
  fixture = await issuedInvoiceFixture();
});

it.each(["admin", "operator"] as const)(
  "derives balances without multiplying items/payments for %s",
  async (role) => {
    const db = createDb(env.DB);
    await db.insert(payments).values([
      {
        id: "a",
        invoiceId: fixture.invoiceId,
        amountCents: 1000,
        receivedAt: now.getTime(),
        createdAt: 1,
      },
      {
        id: "b",
        invoiceId: fixture.invoiceId,
        amountCents: 2000,
        receivedAt: now.getTime(),
        createdAt: 1,
      },
      {
        id: "c",
        invoiceId: fixture.invoiceId,
        amountCents: 500,
        receivedAt: now.getTime(),
        createdAt: 1,
        voidedAt: 2,
      },
    ]);
    const result = await getDashboard(env.DB, { ...fixture.admin, role }, now);
    expect(result.outstandingCents).toBe(7000);
    expect(result.unpaidInvoiceCount).toBe(1);
    expect(result.paymentsReceivedThisMonthCents).toBe(3000);
    expect(result.unpaidInvoices).toEqual([
      expect.objectContaining({
        id: fixture.invoiceId,
        balanceCents: 7000,
        paidCents: 3000,
        customerName: "John Smith",
      }),
    ]);
    expect(result.recentPayments.map((p) => p.id)).toEqual(["c", "b", "a"]);
    expect(result.recentPayments[0].voidedAt).toBe(2);
    expect(result.overdue).toBeNull();
  },
);

it("excludes paid and voided invoices while retaining active receipts on voided invoices", async () => {
  const db = createDb(env.DB);
  await db.insert(payments).values({
    id: "paid",
    invoiceId: fixture.invoiceId,
    amountCents: 10000,
    receivedAt: now.getTime(),
    createdAt: 1,
  });
  expect(
    (await getDashboard(env.DB, fixture.admin, now)).unpaidInvoices,
  ).toEqual([]);
  await db
    .update(invoices)
    .set({ status: "voided", voidedAt: 1 })
    .where(eq(invoices.id, fixture.invoiceId));
  const result = await getDashboard(env.DB, fixture.admin, now);
  expect(result.outstandingCents).toBe(0);
  expect(result.unpaidInvoiceCount).toBe(0);
  expect(result.paymentsReceivedThisMonthCents).toBe(10000);
  expect(result.recentPayments).toHaveLength(1);
});

it("returns genuine financial/job zeros and empty rows, but unknown overdue data", async () => {
  fixture = await draftInvoiceFixture();
  const result = await getDashboard(env.DB, fixture.admin, now);
  expect(result).toMatchObject({
    outstandingCents: 0,
    unpaidInvoiceCount: 0,
    paymentsReceivedThisMonthCents: 0,
    overdue: null,
    unpaidInvoices: [],
    recentPayments: [],
    todaysJobs: { total: 0, remaining: 0 },
  });
});

it.each([
  [
    "2026-09-30T14:30:00Z",
    "2026-09-30T14:00:00Z",
    "2026-10-31T13:00:00Z",
    "2026-10-01",
  ],
  [
    "2026-04-15T00:00:00Z",
    "2026-03-31T13:00:00Z",
    "2026-04-30T14:00:00Z",
    "2026-04-15",
  ],
  [
    "2026-12-31T13:30:00Z",
    "2026-12-31T13:00:00Z",
    "2027-01-31T13:00:00Z",
    "2027-01-01",
  ],
])(
  "uses Melbourne calendar boundaries at %s",
  async (instant, start, end, today) => {
    await createDb(env.DB)
      .insert(payments)
      .values([
        {
          id: "before",
          invoiceId: fixture.invoiceId,
          amountCents: 1,
          receivedAt: Date.parse(start) - 1,
          createdAt: 1,
        },
        {
          id: "start",
          invoiceId: fixture.invoiceId,
          amountCents: 10,
          receivedAt: Date.parse(start),
          createdAt: 1,
        },
        {
          id: "last",
          invoiceId: fixture.invoiceId,
          amountCents: 100,
          receivedAt: Date.parse(end) - 1,
          createdAt: 1,
        },
        {
          id: "next",
          invoiceId: fixture.invoiceId,
          amountCents: 1000,
          receivedAt: Date.parse(end),
          createdAt: 1,
        },
      ]);
    const result = await getDashboard(env.DB, fixture.admin, new Date(instant));
    expect(result.today).toBe(today);
    expect(result.paymentsReceivedThisMonthCents).toBe(110);
  },
);

it("summarises only today's jobs from latest history, including timestamp ties and cancellation", async () => {
  const db = createDb(env.DB);
  await db.update(jobs).set({ scheduledDate: "2026-09-22" });
  await db.insert(jobStatusHistory).values([
    {
      id: "z-completed",
      jobId: fixture.jobId,
      status: "completed",
      createdByUserId: fixture.admin.id,
      createdAt: 9999999999999,
    },
    {
      id: "a-started",
      jobId: fixture.jobId,
      status: "in_progress",
      createdByUserId: fixture.admin.id,
      createdAt: 9999999999999,
    },
    {
      id: "cancelled",
      jobId: fixture.otherJobId,
      status: "cancelled",
      createdByUserId: fixture.admin.id,
      createdAt: 9999999999999,
    },
  ]);
  expect((await getDashboard(env.DB, fixture.admin, now)).todaysJobs).toEqual({
    scheduled: 0,
    in_progress: 0,
    completed: 1,
    cancelled: 1,
    remaining: 0,
    total: 2,
  });
  await db
    .delete(jobStatusHistory)
    .where(eq(jobStatusHistory.id, "z-completed"));
  await db.delete(jobStatusHistory).where(eq(jobStatusHistory.id, "cancelled"));
  expect((await getDashboard(env.DB, fixture.admin, now)).todaysJobs).toEqual({
    scheduled: 1,
    in_progress: 1,
    completed: 0,
    cancelled: 0,
    remaining: 2,
    total: 2,
  });
});

it("limits recent history to five with deterministic ordering", async () => {
  await createDb(env.DB)
    .insert(payments)
    .values(
      Array.from({ length: 7 }, (_, i) => ({
        id: `p${i}`,
        invoiceId: fixture.invoiceId,
        amountCents: 100,
        receivedAt: now.getTime() + i,
        createdAt: 1,
      })),
    );
  expect(
    (await getDashboard(env.DB, fixture.admin, now)).recentPayments.map(
      (p) => p.id,
    ),
  ).toEqual(["p6", "p5", "p4", "p3", "p2"]);
});

it.each([
  "customers.read",
  "invoices.read",
  "payments.read",
  "jobs.read",
] as const)("requires %s before reading data", async (denied) => {
  vi.spyOn(permissions, "can").mockImplementation(
    (_user, permission) => permission !== denied,
  );
  await expect(getDashboard(env.DB, fixture.admin, now)).rejects.toBeInstanceOf(
    PermissionDeniedError,
  );
});
