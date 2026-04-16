import { getCustomers } from "@/lib/api/customers";
import Link from "next/dist/client/link";

export default async function CustomersPage() {
  const customerList = await getCustomers();

  return (
    <main style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <h1>Customers</h1>

      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "24px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Name
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Email
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Phone
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>
              Suburb
            </th>
          </tr>
        </thead>
        <tbody>
          {customerList.items.map((customer) => (
            <tr key={customer.id}>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                <Link href={`/customers/${customer.id}`}>{customer.name}</Link>
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {customer.email ?? "-"}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {customer.phone ?? "-"}
              </td>
              <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                {customer.suburb ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}