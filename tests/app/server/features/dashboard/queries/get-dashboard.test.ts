import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "../../../../../../app/server/auth/authorization/errors/permission-denied-error";
import * as permissions from "../../../../../../app/server/auth/authorization/policies/can";
import { createDb } from "../../../../../../app/server/db/client/create-db.server";
import { invoices } from "../../../../../../app/server/db/schema/invoices";
import { jobs } from "../../../../../../app/server/db/schema/jobs";
import { jobStatusHistory } from "../../../../../../app/server/db/schema/job-status-history";
import { payments } from "../../../../../../app/server/db/schema/payments";
import { getDashboard } from "../../../../../../app/server/features/dashboard/queries/get-dashboard.server";
import { draftInvoiceFixture } from "../../../../../support/fixtures/draft-invoice";
import { issuedInvoiceFixture } from "../../../../../support/fixtures/issued-invoice";

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
        paymentDate: "2026-09-22",
        createdAt: 1,
      },
      {
        id: "b",
        invoiceId: fixture.invoiceId,
        amountCents: 2000,
        paymentDate: "2026-09-22",
        createdAt: 1,
      },
      {
        id: "c",
        invoiceId: fixture.invoiceId,
        amountCents: 500,
        paymentDate: "2026-09-22",
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

    expect(result.recentPayments.map((payment) => payment.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(result.recentPayments[0].voidedAt).toBe(2);

    expect(result.overdue).toEqual({
      balanceCents: 0,
      invoiceCount: 0,
      invoices: [],
    });
  },
);

it("derives overdue balance, count, and attention rows", async () => {
  const db = createDb(env.DB);

  await db
    .update(invoices)
    .set({
      dueDate: "2026-09-10",
    })
    .where(eq(invoices.id, fixture.invoiceId));

  await db.insert(payments).values({
    id: "partial",
    invoiceId: fixture.invoiceId,
    amountCents: 3000,
    paymentDate: "2026-09-22",
    createdAt: 1,
  });

  const result = await getDashboard(env.DB, fixture.admin, now);

  expect(result.outstandingCents).toBe(7000);
  expect(result.unpaidInvoiceCount).toBe(1);

  expect(result.overdue).toEqual({
    balanceCents: 7000,
    invoiceCount: 1,
    invoices: [
      expect.objectContaining({
        id: fixture.invoiceId,
        invoiceNumber: "INV-000001",
        customerName: "John Smith",
        dueDate: "2026-09-10",
        paidCents: 3000,
        balanceCents: 7000,
        daysOverdue: 12,
      }),
    ],
  });
});

it("does not treat an invoice due today as overdue", async () => {
  await createDb(env.DB)
    .update(invoices)
    .set({
      dueDate: "2026-09-22",
    })
    .where(eq(invoices.id, fixture.invoiceId));

  const result = await getDashboard(env.DB, fixture.admin, now);

  expect(result.outstandingCents).toBe(10000);
  expect(result.unpaidInvoiceCount).toBe(1);

  expect(result.overdue).toEqual({
    balanceCents: 0,
    invoiceCount: 0,
    invoices: [],
  });
});

it("treats an unpaid invoice due before today as overdue", async () => {
  await createDb(env.DB)
    .update(invoices)
    .set({
      dueDate: "2026-09-21",
    })
    .where(eq(invoices.id, fixture.invoiceId));

  const result = await getDashboard(env.DB, fixture.admin, now);

  expect(result.overdue).toEqual({
    balanceCents: 10000,
    invoiceCount: 1,
    invoices: [
      expect.objectContaining({
        id: fixture.invoiceId,
        dueDate: "2026-09-21",
        balanceCents: 10000,
        daysOverdue: 1,
      }),
    ],
  });
});

it("excludes paid and voided invoices from overdue and outstanding totals while retaining active receipts", async () => {
  const db = createDb(env.DB);

  await db
    .update(invoices)
    .set({
      dueDate: "2026-09-10",
    })
    .where(eq(invoices.id, fixture.invoiceId));

  await db.insert(payments).values({
    id: "paid",
    invoiceId: fixture.invoiceId,
    amountCents: 10000,
    paymentDate: "2026-09-22",
    createdAt: 1,
  });

  let result = await getDashboard(env.DB, fixture.admin, now);

  expect(result.outstandingCents).toBe(0);
  expect(result.unpaidInvoiceCount).toBe(0);
  expect(result.unpaidInvoices).toEqual([]);
  expect(result.overdue).toEqual({
    balanceCents: 0,
    invoiceCount: 0,
    invoices: [],
  });

  await db
    .update(invoices)
    .set({
      status: "voided",
      voidedAt: 1,
    })
    .where(eq(invoices.id, fixture.invoiceId));

  result = await getDashboard(env.DB, fixture.admin, now);

  expect(result.outstandingCents).toBe(0);
  expect(result.unpaidInvoiceCount).toBe(0);
  expect(result.paymentsReceivedThisMonthCents).toBe(10000);
  expect(result.recentPayments).toHaveLength(1);
  expect(result.overdue).toEqual({
    balanceCents: 0,
    invoiceCount: 0,
    invoices: [],
  });
});

it("returns genuine financial, overdue, and job zeros with empty rows", async () => {
  fixture = await draftInvoiceFixture();

  const result = await getDashboard(env.DB, fixture.admin, now);

  expect(result).toMatchObject({
    outstandingCents: 0,
    unpaidInvoiceCount: 0,
    paymentsReceivedThisMonthCents: 0,
    overdue: {
      balanceCents: 0,
      invoiceCount: 0,
      invoices: [],
    },
    unpaidInvoices: [],
    recentPayments: [],
    todaysJobs: {
      total: 0,
      remaining: 0,
    },
  });
});

it.each([
  [
    "2026-09-30T14:30:00Z",
    "2026-09-30",
    "2026-10-01",
    "2026-10-31",
    "2026-11-01",
    "2026-10-01",
  ],
  [
    "2026-04-15T00:00:00Z",
    "2026-03-31",
    "2026-04-01",
    "2026-04-30",
    "2026-05-01",
    "2026-04-15",
  ],
  [
    "2026-12-31T13:30:00Z",
    "2026-12-31",
    "2027-01-01",
    "2027-01-31",
    "2027-02-01",
    "2027-01-01",
  ],
])(
  "uses Melbourne calendar month boundaries at %s",
  async (instant, beforeDate, startDate, lastDate, nextDate, today) => {
    await createDb(env.DB)
      .insert(payments)
      .values([
        {
          id: "before",
          invoiceId: fixture.invoiceId,
          amountCents: 1,
          paymentDate: beforeDate,
          createdAt: 1,
        },
        {
          id: "start",
          invoiceId: fixture.invoiceId,
          amountCents: 10,
          paymentDate: startDate,
          createdAt: 1,
        },
        {
          id: "last",
          invoiceId: fixture.invoiceId,
          amountCents: 100,
          paymentDate: lastDate,
          createdAt: 1,
        },
        {
          id: "next",
          invoiceId: fixture.invoiceId,
          amountCents: 1000,
          paymentDate: nextDate,
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

  await db.update(jobs).set({
    scheduledDate: "2026-09-22",
  });

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

it("limits recent payment history to five with deterministic ordering", async () => {
  await createDb(env.DB)
    .insert(payments)
    .values(
      Array.from({ length: 7 }, (_, index) => ({
        id: `p${index}`,
        invoiceId: fixture.invoiceId,
        amountCents: 100,
        paymentDate: "2026-09-22",
        createdAt: index,
      })),
    );

  expect(
    (await getDashboard(env.DB, fixture.admin, now)).recentPayments.map(
      (payment) => payment.id,
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
