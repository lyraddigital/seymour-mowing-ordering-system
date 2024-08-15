import Link from "next/link";

import { DashboardJob } from "@/app/models/dashboard-job";
import { DashboardPayment } from "@/app/models/dashboard-payment";
import { convertFromISOToShortDate } from "@/app/utilities/dates";

interface DashboardPaymentsListProps {
  payments: DashboardPayment[];
}

export default function DashboardPaymentsList({ payments }: DashboardPaymentsListProps) {
  return (
    <ul>
      {payments && payments.length > 0 &&
        payments.map((p) => (
          <li key={p.paymentCode} className="gap-10 p-4 text-sm flex justify-between hover:bg-slate-200 border-b">
            <div className="flex flex-col flex-1 gap-1">
              <span className="font-bold">{p.customerName}</span>
              <span className="text-slate-500">
                Payment of ${p.amount} was made on the {convertFromISOToShortDate(p.date)}
              </span>
            </div>
            <div className="flex justify-center items-center flex-[100px] grow-0">
              <Link className="text-green-800 active:text-green-500 uppercase" href={`jobs/${p.paymentCode}`}>
                View
              </Link>
            </div>
          </li>
        ))}
    </ul>
  );
}
