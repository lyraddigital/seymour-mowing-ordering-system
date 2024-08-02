import Link from "next/link";

import { getCustomers } from "../../data/customers";
import SectionHeading from "../ui/section-heading";

export default function DashboardCustomersTable() {
  const customers = getCustomers();

  return (
    <section className="mt-8">
        <header>
          <SectionHeading>Customers Currently Owing</SectionHeading>
        </header>
        {/* <div>
          <span>Action</span>
          <span>Search</span>
        </div> */}
        <table className="mt-6 w-full table-fixed border border-slate-500">
          <colgroup>
            <col />
            <col className="w-[200px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead>
            <tr className="bg-green-200">
              <th className="text-left py-2 px-1 border border-slate-500 uppercase">Customer</th>
              <th className="py-2 px-1 border border-slate-500 uppercase">Amount Owing</th>
              <th className="py-2 px-1 border border-slate-500">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.customerCode} className="odd:bg-slate-50 even:bg-slate-200 font-bold">
                <td className="p-1 border border-slate-500">
                  {c.customerName}
                </td>
                <td className="p-1 border border-slate-500 text-right text-green-900">${c.amountOwing.toFixed(2)}</td>
                <td className="p-1 border border-slate-500 text-center">
                  <Link className="text-green-800 hover:text-green-500" href={`customers/${c.customerCode}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section> 
  );
}
