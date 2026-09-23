import { Link } from "react-router";
import type { ComponentProps } from "react";

import type { Dashboard } from "../../../../../server/features/dashboard/queries/get-dashboard.server";
import Icon from "../../../../components/icon/icon";
import ui from "../../../../styles/product.module.css";
import styles from "./dashboard-page.module.css";

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const date = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dueDate = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface DashboardPageProps {
  dashboard: Dashboard;
}

function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ComponentProps<typeof Icon>["name"];
  title: string;
  children: string;
}) {
  return (
    <div className={styles.empty}>
      <span className={ui.iconCircle}>
        <Icon name={icon} />
      </span>

      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default function DashboardPage({ dashboard }: DashboardPageProps) {
  const { overdue, todaysJobs } = dashboard;

  return (
    <div className={ui.page}>
      <header className={ui.header}>
        <div>
          <h1 className="page-title">Dashboard</h1>

          <p className={ui.intro}>
            Financial health and operational activity at a glance.
          </p>
        </div>
      </header>

      <dl className={styles.metrics}>
        <div>
          <span className={ui.iconCircle}>
            <Icon name="balance" />
          </span>

          <dt>Outstanding balance</dt>
          <dd>{currency.format(dashboard.outstandingCents / 100)}</dd>

          <dd className={styles.context}>
            Across {dashboard.unpaidInvoiceCount} unpaid{" "}
            {dashboard.unpaidInvoiceCount === 1 ? "invoice" : "invoices"}
          </dd>
        </div>

        <div>
          <span className={`${ui.iconCircle} ${styles.danger}`}>
            <Icon name="danger" />
          </span>

          <dt>Overdue balance</dt>
          <dd>{currency.format(overdue.balanceCents / 100)}</dd>

          <dd className={styles.context}>
            Across {overdue.invoiceCount} overdue{" "}
            {overdue.invoiceCount === 1 ? "invoice" : "invoices"}
          </dd>
        </div>

        <div>
          <span className={`${ui.iconCircle} ${styles.warning}`}>
            <Icon name="invoice" />
          </span>

          <dt>Invoices overdue</dt>
          <dd>{overdue.invoiceCount}</dd>

          <dd className={styles.context}>
            Issued invoices past their due date
          </dd>
        </div>

        <div>
          <span className={ui.iconCircle}>
            <Icon name="finance" />
          </span>

          <dt>Payments received this month</dt>
          <dd>
            {currency.format(dashboard.paymentsReceivedThisMonthCents / 100)}
          </dd>

          <dd className={styles.context}>Active payments · Melbourne time</dd>
        </div>
      </dl>

      <div className={styles.sections}>
        <section
          className={`${styles.panel} ${styles.attention}`}
          aria-labelledby="attention-heading"
        >
          <header className={`${ui.sectionHeading} ${styles.sectionHeading}`}>
            <span className={`${ui.iconCircle} ${styles.danger}`}>
              <Icon name="danger" />
            </span>

            <div>
              <h2 id="attention-heading">Needs attention</h2>
              <p>Invoices that need your focus.</p>
            </div>

            <Link className={styles.viewAll} to="/invoices">
              View all invoices →
            </Link>
          </header>

          {overdue.invoices.length ? (
            <div className={styles.attentionContent}>
              <div className={styles.attentionSubheading}>
                <Icon name="invoice" />

                <h3>Overdue invoices</h3>

                <span
                  className={styles.attentionCount}
                  aria-label={`${overdue.invoiceCount} overdue invoices`}
                >
                  {overdue.invoiceCount}
                </span>
              </div>

              <div
                className={`${ui.tableScroll} ${styles.attentionTableScroll}`}
                role="region"
                aria-label="Overdue invoices"
                tabIndex={0}
              >
                <table
                  className={`${ui.table} ${styles.attentionTable}`}
                  aria-label="Overdue invoices"
                >
                  <thead>
                    <tr>
                      <th scope="col">Customer</th>
                      <th scope="col">Invoice</th>
                      <th scope="col">Due date</th>
                      <th scope="col">Days overdue</th>
                      <th scope="col" className={ui.numeric}>
                        Balance
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {overdue.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <Link to={`/customers/${invoice.customerId}`}>
                            {invoice.customerName}
                          </Link>
                        </td>

                        <td>
                          <Link to={`/invoices/${invoice.id}`}>
                            {invoice.invoiceNumber}
                          </Link>
                        </td>

                        <td>
                          <time dateTime={invoice.dueDate}>
                            {dueDate.format(
                              new Date(`${invoice.dueDate}T00:00:00Z`),
                            )}
                          </time>
                        </td>

                        <td>
                          <span className={styles.daysOverdue}>
                            {invoice.daysOverdue}{" "}
                            {invoice.daysOverdue === 1 ? "day" : "days"}
                          </span>
                        </td>

                        <td className={ui.numeric}>
                          {currency.format(invoice.balanceCents / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState icon="invoice" title="All caught up!">
              There are no invoices that need attention right now.
            </EmptyState>
          )}
        </section>

        <section
          className={`${styles.panel} ${styles.unpaid}`}
          aria-labelledby="unpaid-heading"
        >
          <header className={`${ui.sectionHeading} ${styles.sectionHeading}`}>
            <Icon name="invoice" />

            <h2 id="unpaid-heading">Partially paid / unpaid invoices</h2>

            <Link className={styles.viewAll} to="/invoices">
              View all →
            </Link>
          </header>

          {dashboard.unpaidInvoices.length ? (
            <div
              className={ui.tableScroll}
              role="region"
              aria-label="Unpaid invoices"
              tabIndex={0}
            >
              <table
                className={`${ui.table} ${styles.table}`}
                aria-label="Partially paid / unpaid invoices"
              >
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col">Invoice</th>
                    <th scope="col">Status</th>
                    <th scope="col" className={ui.numeric}>
                      Balance
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.unpaidInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <Link to={`/customers/${invoice.customerId}`}>
                          {invoice.customerName}
                        </Link>
                      </td>

                      <td>
                        <Link to={`/invoices/${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </Link>
                      </td>

                      <td>
                        <span
                          className={`${ui.badge} ${
                            invoice.paidCents > 0
                              ? styles.warning
                              : styles.danger
                          }`}
                        >
                          {invoice.paidCents > 0 ? "Partially paid" : "Unpaid"}
                        </span>
                      </td>

                      <td className={ui.numeric}>
                        {currency.format(invoice.balanceCents / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="invoice" title="No unpaid invoices">
              All invoices are paid in full. Great work!
            </EmptyState>
          )}
        </section>

        <section
          className={`${styles.panel} ${styles.payments}`}
          aria-labelledby="payments-heading"
        >
          <header className={`${ui.sectionHeading} ${styles.sectionHeading}`}>
            <Icon name="payment" />

            <h2 id="payments-heading">Recent payments</h2>

            <Link className={styles.viewAll} to="/payments">
              View all →
            </Link>
          </header>

          {dashboard.recentPayments.length ? (
            <div
              className={ui.tableScroll}
              role="region"
              aria-label="Recent payment history"
              tabIndex={0}
            >
              <table
                className={`${ui.table} ${styles.table}`}
                aria-label="Recent payments"
              >
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Invoice</th>
                    <th scope="col" className={ui.numeric}>
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <time
                          dateTime={new Date(payment.receivedAt).toISOString()}
                        >
                          {date.format(payment.receivedAt)}
                        </time>
                      </td>

                      <td>
                        <Link to={`/customers/${payment.customerId}`}>
                          {payment.customerName}
                        </Link>
                      </td>

                      <td>
                        <Link to={`/invoices/${payment.invoiceId}`}>
                          {payment.invoiceNumber}
                        </Link>
                      </td>

                      <td className={ui.numeric}>
                        {currency.format(payment.amountCents / 100)}

                        {payment.voidedAt !== null && (
                          <span className={`${ui.voided} ${styles.voided}`}>
                            Voided
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="payment" title="No recent payments">
              Payments you receive will appear here.
            </EmptyState>
          )}
        </section>

        <section
          className={`${styles.panel} ${styles.jobs}`}
          aria-labelledby="jobs-heading"
        >
          <header className={`${ui.sectionHeading} ${styles.sectionHeading}`}>
            <span className={ui.iconCircle}>
              <Icon name="jobs" />
            </span>

            <div>
              <h2 id="jobs-heading">Today's jobs</h2>
              <p>A snapshot of today's scheduled work · Melbourne time.</p>
            </div>

            <Link className={styles.viewAll} to="/jobs">
              View all jobs →
            </Link>
          </header>

          {todaysJobs.total ? (
            <>
              <dl className={styles.jobMetrics}>
                <div>
                  <dt>Scheduled</dt>
                  <dd>{todaysJobs.scheduled}</dd>
                </div>

                <div>
                  <dt>In progress</dt>
                  <dd>{todaysJobs.in_progress}</dd>
                </div>

                <div>
                  <dt>Completed</dt>
                  <dd>{todaysJobs.completed}</dd>
                </div>

                <div>
                  <dt>Remaining</dt>
                  <dd>{todaysJobs.remaining}</dd>
                </div>
              </dl>

              <p className={styles.jobContext}>
                {todaysJobs.total} jobs today · {todaysJobs.cancelled}{" "}
                cancelled. Remaining includes scheduled and in-progress jobs.
              </p>
            </>
          ) : (
            <EmptyState icon="jobs" title="No jobs scheduled today">
              Enjoy the day! New jobs will appear here when they're scheduled.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
