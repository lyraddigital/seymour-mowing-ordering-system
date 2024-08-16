import DashboardSummaryTiles from "./components/dashboard/dashboard-summary-tiles";
import DashboardCustomersList from "./components/dashboard/dashboard-customers-list";
import DashboardInvoiceList from "./components/dashboard/dashboard-invoice-list";
import DashboardJobsList from "./components/dashboard/dashboard-jobs-list";
import DashboardPaymentsList from "./components/dashboard/dashboard-payments-list";
import DashboardListTile from "./components/dashboard/dashboard-list-tile";
import client from "./graphql/graphql-client";
import { getDashboardQuery } from "./graphql/queries/get-dashboard";
import { GetDashboardResult } from "./models/get-dashboard-result";

export default async function Home() {
  const { getDashboard } = await client.request<GetDashboardResult>(getDashboardQuery);
  const numberOfCustomersOwing = getDashboard?.customersOwing?.length || 0;
  const numberOfInvoicesUnpaid = getDashboard?.unpaidInvoices?.length || 0;
  const numberOfJobsNotStarted = getDashboard?.latestJobs?.length || 0;
  const numberOfRecentPayments = getDashboard?.recentPayments?.length || 0;

  return (
    <>
      <header>
        <h1 className="text-3xl text-green-800 font-bold uppercase my-6">Dashboard</h1>
      </header>
      <DashboardSummaryTiles summary={getDashboard.summary} />
      <div className="my-6 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10 min-h-32 items-start">
        <div>
          <DashboardListTile
            title="Customers Owing"
            description="Number of customers owing money currently"
            numberOfRecords={numberOfCustomersOwing}
            showMoreUrl="/customers?filter=owe"
          >
            <DashboardCustomersList customers={getDashboard?.customersOwing} />
          </DashboardListTile>
          <DashboardListTile
            title="Recent Payments"
            description="The most recent payments made"
            numberOfRecords={numberOfRecentPayments}
            showMoreUrl="/payments?mode=recent"
          >
            <DashboardPaymentsList payments={getDashboard?.recentPayments} />
          </DashboardListTile>
        </div>

        <DashboardListTile
          title="Unpaid Invoices"
          description="The number of invoices that are yet to be fully paid"
          numberOfRecords={numberOfInvoicesUnpaid}
          showMoreUrl="/invoices?filter=unpaid"
        >
          <DashboardInvoiceList unpaidInvoices={getDashboard?.unpaidInvoices} />
        </DashboardListTile>
        <DashboardListTile
          title="Scheduled Jobs"
          description="The latest jobs that have been registered, but not started"
          numberOfRecords={numberOfJobsNotStarted}
          showMoreUrl="/jobs?filter=not-started"
        >
          <DashboardJobsList jobs={getDashboard?.latestJobs} />
        </DashboardListTile>
      </div>
    </>
  );
}
