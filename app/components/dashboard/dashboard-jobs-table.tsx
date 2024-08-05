import { DashboardJob } from "@/app/models/dashboard-job";

import { convertFromISOToShortDate } from "@/app/utilities/dates";
import { stringOrText } from "@/app/utilities/strings";
import { getCurrencyString } from "@/app/utilities/currency";
import { numberOrText } from "@/app/utilities/numbers";

import SectionHeading from "../ui/section-heading";
import Link from "next/link";

interface DashboardJobsTableProps {
  jobs: DashboardJob[];
}

export default function DashboardJobsTable({ jobs }: DashboardJobsTableProps) {
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
          <col className="w-[150px]" />
        </colgroup>
        <thead>
          <tr className="bg-green-800 text-white">
            <th className="text-left py-2 px-1 border border-slate-500 uppercase">Date</th>
            <th className="text-left py-2 px-1 border border-slate-500 uppercase">Job</th>
            <th className="text-left py-2 px-1 border border-slate-500 uppercase">Customer</th>
            <th className="py-2 px-1 border border-slate-500 text-center uppercase">Status</th>
            <th className="py-2 px-1 border border-slate-500 uppercase">Qty</th>
            <th className="py-2 px-1 border border-slate-500 uppercase">Cost</th>
            <th className="py-2 px-1 border border-slate-500 uppercase">Total</th>
            <th className="py-2 px-1 border border-slate-500">&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.jobCode} className="odd:bg-slate-50 even:bg-slate-200 font-bold">
              <td className="p-1 border border-slate-500 text-green-900">{convertFromISOToShortDate(j.date)}</td>
              <td className="p-1 border border-slate-500 text-green-900">{j.jobName}</td>
              <td className="p-1 border border-slate-500 text-green-900">{j.customerName}</td>
              <td className="p-1 border border-slate-500 text-center text-green-900">{j.status}</td>
              <td className="p-1 border border-slate-500 text-center text-green-900">{numberOrText(j.quantity, '-')}</td>
              <td className="p-1 border border-slate-500 text-green-900 text-right">{stringOrText(getCurrencyString(j.cost), '-')}</td>
              <td className="p-1 border border-slate-500 text-green-900 text-right">{stringOrText(getCurrencyString(j.total), '-')}</td>
              <td className="p-1 border border-slate-500 text-green-900 text-center">
                <Link className="text-green-800 hover:text-green-500" href={`jobs/${j.jobCode}`}>
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
