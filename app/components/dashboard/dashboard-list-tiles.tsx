import { DashboardCustomer } from "@/app/models/dashboard-customer";
import { DashboardUnpaidInvoice } from "@/app/models/dashboard-unpaid-invoice";
import { DashboardJob } from "@/app/models/dashboard-job";
import { DashboardListItem } from "@/app/models/dashboard-list-item";
import { DashboardPayment } from "@/app/models/dashboard-payment";
import { getCurrencyString } from "@/app/utilities/currency";
import { convertFromISOToShortDate } from "@/app/utilities/dates";

import DashboardListTile from "./dashboard-list-tile";

interface DashboardListTilesProps {
    customersOwing: DashboardCustomer[];
    unpaidInvoices: DashboardUnpaidInvoice[];
    latestJobs: DashboardJob[];
    recentPayments: DashboardPayment[];
}

export default function DashboardListTiles({ customersOwing, unpaidInvoices, latestJobs, recentPayments }: DashboardListTilesProps) {
    const customerOwingListItems = customersOwing?.map<DashboardListItem>(co => ({
        code: co.customerCode,
        title: co.customerName,
        summary: getCurrencyString(co.amountOwing),
        pageLink: `customers/${co.customerCode}`
    }));
    const numberOfInvoicesUnpaid = unpaidInvoices?.map<DashboardListItem>(ui => ({
        code: ui.invoiceNumber,
        title: `${ui.customerName} (${getCurrencyString(ui.total)})`,
        summary: `Due ${convertFromISOToShortDate(ui.dueDate)}`,
        pageLink: `invoices/${ui.invoiceNumber}`
    }));
    const numberOfJobsNotStarted = latestJobs?.map<DashboardListItem>(lj => ({
        code: lj.jobCode,
        title: lj.customerName,
        summary: lj.jobName,
        pageLink: `jobs/${lj.jobCode}`
    }));
    const numberOfRecentPayments = recentPayments?.map<DashboardListItem>(rp => ({
        code: rp.paymentCode,
        title: rp.customerName,
        summary: `Payment of $${rp.amount} was made on the ${convertFromISOToShortDate(rp.date)}`,
        pageLink: `payments/${rp.paymentCode}`
    }));

    return (
        <div className="my-6 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10 min-h-32 lg:auto-rows-[303px]">
            <DashboardListTile
                title="Customers Owing"
                description="Number of customers owing money currently"
                items={customerOwingListItems}
            />
            <DashboardListTile
                title="Unpaid Invoices"
                description="The number of invoices that are yet to be fully paid"
                items={numberOfInvoicesUnpaid}
            />
            <DashboardListTile
                title="Scheduled Jobs"
                description="The latest jobs that have been registered, but not started"
                items={numberOfJobsNotStarted}
            />
            <DashboardListTile
                title="Recent Payments"
                description="The most recent payments made"
                items={numberOfRecentPayments}
            />
        </div>
    )
}
