import Link from "next/link";

import { DashboardUnpaidInvoice } from "@/app/models/dashboard-unpaid-invoice";
import { convertFromISOToShortDate } from "@/app/utilities/dates";
import { getCurrencyString } from "@/app/utilities/currency";

interface DashboardInvoiceListProps {
    unpaidInvoices?: DashboardUnpaidInvoice[];
}

export default function DashboardInvoiceList({ unpaidInvoices }: DashboardInvoiceListProps) {
    return (
        <ul>
            {unpaidInvoices && unpaidInvoices.length > 0 &&
                unpaidInvoices.map((ui) => (
                    <li key={ui.invoiceNumber} className="gap-3 p-4 text-sm flex hover:bg-slate-200 border-b h-[77px]">
                        <div className="flex flex-1 justify-between gap-10">
                            <div className="flex flex-col flex-1 gap-1">
                                <span className="font-bold">{ui.customerName} ({getCurrencyString(ui.total)})</span>
                                <span className="text-slate-500">Due: {convertFromISOToShortDate(ui.dueDate)}</span>
                            </div>
                            <div className="flex justify-center items-center flex-[100px] grow-0">
                                <Link className="text-green-800 active:text-green-500 uppercase" href={`invoices/${ui.invoiceNumber}`}>
                                    View
                                </Link>
                            </div>
                        </div>
                    </li>
                )
                )}
        </ul>
    );
}
