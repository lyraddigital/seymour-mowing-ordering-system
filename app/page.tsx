import DashboardSummaryTiles from "./components/dashboard/dashboard-summary-tiles";
import DashboardListTile from "./components/dashboard/dashboard-list-tile";
import client from "./graphql/graphql-client";
import { getDashboardQuery } from "./graphql/queries/get-dashboard";
import { DashboardListItem } from "./models/dashboard-list-item";
import { GetDashboardResult } from "./models/get-dashboard-result";
import { getCurrencyString } from "./utilities/currency";
import { convertFromISOToShortDate } from "./utilities/dates";

export default async function Home() {
  const { getDashboard } = await client.request<GetDashboardResult>(getDashboardQuery);
  const customerOwingListItems = getDashboard?.customersOwing?.map<DashboardListItem>(co => ({
    code: co.customerCode,
    title: co.customerName,
    summary: getCurrencyString(co.amountOwing),
    pageLink: `customers/${co.customerCode}`
  }));
  const numberOfInvoicesUnpaid = getDashboard?.unpaidInvoices?.map<DashboardListItem>(ui => ({
    code: ui.invoiceNumber,
    title: `${ui.customerName} (${getCurrencyString(ui.total)})`,
    summary: `Due ${convertFromISOToShortDate(ui.dueDate)}`,
    pageLink: `invoices/${ui.invoiceNumber}`
  }));
  const numberOfJobsNotStarted = getDashboard?.latestJobs?.map<DashboardListItem>(lj => ({
    code: lj.jobCode,
    title: lj.jobName,
    summary: lj.customerName,
    pageLink: `jobs/${lj.jobCode}`
  }));
  const numberOfRecentPayments = getDashboard?.recentPayments?.map<DashboardListItem>(rp => ({
    code: rp.paymentCode,
    title: rp.customerName,
    summary: `Payment of $${rp.amount} was made on the ${convertFromISOToShortDate(rp.date)}`,
    pageLink: `payments/${rp.paymentCode}`
  }));

  return (
    <>
      <header>
        <h1 className="text-3xl text-green-800 font-bold uppercase my-6">Dashboard</h1>
      </header>
      <DashboardSummaryTiles summary={getDashboard.summary} />
      <div className="my-6 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10 min-h-32 lg:auto-rows-[303px]">
        <DashboardListTile 
          title="Customers Owing" 
          description="Number of customers owing money currently"
          items={[]}
          showMoreUrl="/customers?filter=owe"
        />
        <DashboardListTile
          title="Unpaid Invoices"
          description="The number of invoices that are yet to be fully paid"
          items={numberOfInvoicesUnpaid}
          showMoreUrl="/invoices?filter=unpaid"
        />
        <DashboardListTile
          title="Scheduled Jobs"
          description="The latest jobs that have been registered, but not started"
          items={numberOfJobsNotStarted}
          showMoreUrl="/jobs?filter=not-started"
        />
        <DashboardListTile 
          title="Recent Payments" 
          description="The most recent payments made" 
          items={numberOfRecentPayments}
          showMoreUrl="/payments?mode=recent"
        />
      </div>
    </>
  );
}
