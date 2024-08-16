import Link from "next/link";

import { DashboardJob } from "@/app/models/dashboard-job";
import { convertFromISOToShortDate } from "@/app/utilities/dates";

interface DashboardJobsListProps {
  jobs: DashboardJob[];
}

export default function DashboardJobsList({ jobs }: DashboardJobsListProps) {
  return (
    <ul>
      {jobs && jobs.length > 0 &&
        jobs.map((c) => (
          <li key={c.jobCode} className="gap-10 p-4 text-sm flex justify-between hover:bg-slate-200 border-b">
            <div className="flex flex-col flex-1 gap-1 overflow-hidden">
              <span className="font-bold truncate">{c.jobName}</span>
              <span className="text-slate-500 truncate">{c.customerName}</span>
            </div>
            <div className="flex justify-center items-center flex-[100px] grow-0">
              <Link className="text-green-800 active:text-green-500 uppercase" href={`jobs/${c.jobCode}`}>
                View
              </Link>
            </div>
          </li>
        ))}
    </ul>

    // <section className="mt-8">
    //   <header>
    //     <SectionHeading>Latest Jobs</SectionHeading>
    //   </header>
    //   <table className="mt-6 w-full table-fixed border border-slate-500">
    //     <colgroup>
    //       <col className="w-[120px]" />
    //       <col />
    //       <col className="w-[300px]" />
    //       <col className="w-[175px]" />
    //       <col className="w-[50px]" />
    //       <col className="w-[120px]" />
    //       <col className="w-[150px]" />
    //       <col className="w-[150px]" />
    //     </colgroup>
    //     <thead>
    //       <tr className="bg-green-800 text-white">
    //         <th className="text-left py-2 px-1 border border-slate-500 uppercase">Date</th>
    //         <th className="text-left py-2 px-1 border border-slate-500 uppercase">Job</th>
    //         <th className="text-left py-2 px-1 border border-slate-500 uppercase">Customer</th>
    //         <th className="py-2 px-1 border border-slate-500 text-center uppercase">Status</th>
    //         <th className="py-2 px-1 border border-slate-500 uppercase">Qty</th>
    //         <th className="py-2 px-1 border border-slate-500 uppercase">Cost</th>
    //         <th className="py-2 px-1 border border-slate-500 uppercase">Total</th>
    //         <th className="py-2 px-1 border border-slate-500">&nbsp;</th>
    //       </tr>
    //     </thead>
    //     <tbody>
    //       {jobs.map((j) => (
    //         <tr key={j.jobCode} className="odd:bg-slate-50 even:bg-slate-200 font-bold">
    //           <td className="p-1 border border-slate-500 text-green-900">{convertFromISOToShortDate(j.date)}</td>
    //           <td className="p-1 border border-slate-500 text-green-900">{j.jobName}</td>
    //           <td className="p-1 border border-slate-500 text-green-900">{j.customerName}</td>
    //           <td className="p-1 border border-slate-500 text-center text-green-900">{j.status}</td>
    //           <td className="p-1 border border-slate-500 text-center text-green-900">{numberOrText(j.quantity, '-')}</td>
    //           <td className="p-1 border border-slate-500 text-green-900 text-right">{stringOrText(getCurrencyString(j.cost), '-')}</td>
    //           <td className="p-1 border border-slate-500 text-green-900 text-right">{stringOrText(getCurrencyString(j.total), '-')}</td>
    //           <td className="p-1 border border-slate-500 text-green-900 text-center">
    //             <Link className="text-green-800 hover:text-green-500" href={`jobs/${j.jobCode}`}>
    //               View
    //             </Link>
    //           </td>
    //         </tr>
    //       ))}
    //     </tbody>
    //   </table>
    // </section>
  );
}
