import Link from "next/link";

import { DashboardCustomer } from "@/app/models/dashboard-customer";
import { getCurrencyString } from "@/app/utilities/currency";

interface DashboardCustomersListProps {
    customers?: DashboardCustomer[];
}

export default function DashboardCustomersList({ customers }: DashboardCustomersListProps) {
    return (
        <ul>
            {customers && customers.length > 0 &&
                customers.map((c) => (
                    <li key={c.customerCode} className="gap-10 p-4 text-sm flex justify-between hover:bg-slate-200 border-b">
                        <div className="flex flex-col flex-1 gap-1">
                            <span className="font-bold">{c.customerName}</span>
                            <span className="text-slate-500">{getCurrencyString(c.amountOwing)}</span>
                        </div>
                        <div className="flex justify-center items-center flex-[100px] grow-0">
                            <Link className="text-green-800 active:text-green-500 uppercase" href={`customers/${c.customerCode}`}>
                                View
                            </Link>
                        </div>
                    </li>
                ))}
        </ul>
    );
}
