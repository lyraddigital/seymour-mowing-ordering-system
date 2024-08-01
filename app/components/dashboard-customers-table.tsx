import Link from "next/link";

import { getCustomers } from "../data/customers";

export default function DashboardCustomersTable() {
  const customers = getCustomers();

  return (
    <section className="mt-8">
        <header>
          <h2 className="text-2xl">Customers Currently Owing</h2>
        </header>
        <table className="mt-6 w-full table-fixed border border-slate-500">
          <colgroup>
            <col />
            <col className="w-[200px]" />
          </colgroup>
          <thead>
            <tr className="bg-green-200">
              <th className="text-left py-2 px-1 border border-slate-500 uppercase">Customer</th>
              <th className="py-2 px-1 border border-slate-500 uppercase">Amount Owing</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.customerCode} className="odd:bg-slate-50 even:bg-slate-200 font-bold">
                <td className="p-1 border border-slate-500">
                  <Link className="text-green-800 hover:text-green-500" href={`customers/${c.customerCode}`}>{c.customerName}</Link>
                </td>
                <td className="p-1 border border-slate-500 text-right text-green-900">${c.amountOwing.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section> 
  );
}
