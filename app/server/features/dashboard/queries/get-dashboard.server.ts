import { and, asc, desc, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { PermissionDeniedError } from "../../../auth/authorization/errors/permission-denied-error";
import { can } from "../../../auth/authorization/policies/can";
import type { CurrentUser } from "../../../auth/principal/types/current-user";
import { createDb } from "../../../db/client/create-db.server";
import { customers } from "../../../db/schema/customers";
import { invoices } from "../../../db/schema/invoices";
import { invoiceItems } from "../../../db/schema/invoice-items";
import { payments } from "../../../db/schema/payments";
import { jobs } from "../../../db/schema/jobs";
import { jobStatusHistory } from "../../../db/schema/job-status-history";

// Dashboard calendar dates follow the Victorian business timezone, including DST.
function monthStart(year: number, month: number) {
  const utc = Date.UTC(year, month, 1);
  const localHour = Number(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Melbourne",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(utc),
  );
  // Melbourne is UTC+10/+11; neither offset transition occurs at month-start.
  return utc - localHour * 60 * 60 * 1000;
}

export async function getDashboard(
  binding: Env["DB"],
  user: CurrentUser,
  now = new Date(),
) {
  if (
    !can(user, "customers.read") ||
    !can(user, "invoices.read") ||
    !can(user, "payments.read") ||
    !can(user, "jobs.read")
  ) {
    throw new PermissionDeniedError();
  }
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) =>
    parts.find((entry) => entry.type === name)!.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const year = Number(part("year"));
  const month = Number(part("month")) - 1;
  const db = createDb(binding);
  // Aggregate independently before joining, so multiple items/payments cannot multiply totals.
  const totals = db
    .select({
      invoiceId: invoiceItems.invoiceId,
      cents: sql<number>`sum(${invoiceItems.amountCents})`.as("total_cents"),
    })
    .from(invoiceItems)
    .groupBy(invoiceItems.invoiceId)
    .as("totals");
  const paid = db
    .select({
      invoiceId: payments.invoiceId,
      cents: sql<number>`sum(${payments.amountCents})`.as("paid_cents"),
    })
    .from(payments)
    .where(isNull(payments.voidedAt))
    .groupBy(payments.invoiceId)
    .as("paid");
  const balances = db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: sql<string>`${customers.id}`.as("customer_id"),
      customerName: customers.name,
      issuedAt: invoices.issuedAt,
      paidCents: sql<number>`coalesce(${paid.cents}, 0)`.as(
        "active_paid_cents",
      ),
      balanceCents:
        sql<number>`coalesce(${totals.cents}, 0) - coalesce(${paid.cents}, 0)`.as(
          "balance_cents",
        ),
    })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .leftJoin(totals, eq(totals.invoiceId, invoices.id))
    .leftJoin(paid, eq(paid.invoiceId, invoices.id))
    .where(eq(invoices.status, "issued"))
    .as("balances");
  const history = alias(jobStatusHistory, "latest_history");
  const latest = db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.jobId, jobs.id))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(1);
  const [summaryRows, unpaidInvoices, monthRows, recentPayments, jobCounts] =
    await db.batch([
      db
        .select({
          outstandingCents: sql<number>`coalesce(sum(${balances.balanceCents}), 0)`,
          unpaidInvoiceCount: sql<number>`count(*)`,
        })
        .from(balances)
        .where(gt(balances.balanceCents, 0)),
      db
        .select()
        .from(balances)
        .where(gt(balances.balanceCents, 0))
        .orderBy(asc(balances.issuedAt), asc(balances.id))
        .limit(5),
      db
        .select({
          cents: sql<number>`coalesce(sum(${payments.amountCents}), 0)`,
        })
        .from(payments)
        .where(
          and(
            isNull(payments.voidedAt),
            gte(payments.receivedAt, monthStart(year, month)),
            lt(payments.receivedAt, monthStart(year, month + 1)),
          ),
        ),
      db
        .select({
          id: payments.id,
          invoiceId: payments.invoiceId,
          invoiceNumber: invoices.invoiceNumber,
          customerId: sql<string>`${customers.id}`.as("customer_id"),
          customerName: customers.name,
          amountCents: payments.amountCents,
          receivedAt: payments.receivedAt,
          voidedAt: payments.voidedAt,
        })
        .from(payments)
        .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
        .innerJoin(customers, eq(customers.id, invoices.customerId))
        .orderBy(desc(payments.receivedAt), desc(payments.id))
        .limit(5),
      db
        .select({
          status: jobStatusHistory.status,
          count: sql<number>`count(*)`,
        })
        .from(jobs)
        .innerJoin(
          jobStatusHistory,
          and(
            eq(jobStatusHistory.jobId, jobs.id),
            eq(jobStatusHistory.id, latest),
          ),
        )
        .where(eq(jobs.scheduledDate, today))
        .groupBy(jobStatusHistory.status),
    ]);
  const todaysJobs = {
    scheduled: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
    remaining: 0,
  };
  for (const row of jobCounts) {
    todaysJobs[row.status] = row.count;
    todaysJobs.total += row.count;
  }
  todaysJobs.remaining = todaysJobs.scheduled + todaysJobs.in_progress;
  return {
    today,
    ...summaryRows[0],
    paymentsReceivedThisMonthCents: monthRows[0].cents,
    // No authoritative due date exists. Null must never be rendered as a known zero.
    overdue: null,
    unpaidInvoices,
    recentPayments,
    todaysJobs,
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
