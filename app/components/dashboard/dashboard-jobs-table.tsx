import Link from "next/link";

import { getJobs } from "../../data/jobs";
import SectionHeading from "../ui/section-heading";

export default function DashboardJobsTable() {
  const jobs = getJobs();

  return (
    <section className="mt-8">
        <header>
          <SectionHeading>Latest Jobs</SectionHeading>
        </header>
        <table className="mt-6 w-full table-fixed border border-slate-500">
          <colgroup>
            <col className="w-[120px]" />
            <col />
            <col className="w-[300px]" />
            <col className="w-[175px]" />
            <col className="w-[50px]" />
            <col className="w-[120px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead>
            <tr className="bg-green-200">
              <th className="text-left py-2 px-1 border border-slate-500 uppercase">Date</th>
              <th className="text-left py-2 px-1 border border-slate-500 uppercase">Job</th>
              <th className="text-left py-2 px-1 border border-slate-500 uppercase">Customer</th>
              <th className="text-left py-2 px-1 border border-slate-500 text-center uppercase">Status</th>
              <th className="py-2 px-1 border border-slate-500 uppercase">Qty</th>
              <th className="py-2 px-1 border border-slate-500 uppercase">Cost</th>
              <th className="py-2 px-1 border border-slate-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.jobCode} className="odd:bg-slate-50 even:bg-slate-200 font-bold">
                <td className="p-1 border border-slate-500 text-green-900">{j.date}</td>
                <td className="p-1 border border-slate-500 text-green-900">{j.name}</td>
                <td className="p-1 border border-slate-500 text-green-900">{j.customerName}</td>
                <td className="p-1 border border-slate-500 text-center text-green-900">{j.status}</td>
                <td className="p-1 border border-slate-500 text-center text-green-900">{j.quantity || '-'}</td>
                <td className="p-1 border border-slate-500 text-green-900 text-right">{j.cost?.toFixed(2) ? `$${j.cost.toFixed(2)}`: '-'}</td>
                <td className="p-1 border border-slate-500 text-green-900 text-right">{j.total?.toFixed(2) ? `$${j.total.toFixed(2)}`: '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section> 
  );
}
