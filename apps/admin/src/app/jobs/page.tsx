import { getJobs } from "@/lib/api/jobs";
import { formatDate } from "@/lib/format/date";
import Link from "next/dist/client/link";

export default async function JobsPage() {
  const jobList = await getJobs();

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Jobs</h1>

      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "24px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Customer
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Service date
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Service type
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {jobList.items.map((job) => (
            <tr key={job.id}>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {job.customerName}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {formatDate(job.serviceDate)}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                <Link href={`/jobs/${job.id}`}>{job.serviceType}</Link>
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {job.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}