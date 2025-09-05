import { DataTableContainer } from "@/app/core/components/ui/tables";
import { getCustomersPage } from "@/app/core/data";

import CustomerTableBody from "./customer-table-body";

export default async function CustomersTableAsync() {
  const pageSize = 10;
  const result = await getCustomersPage(1, pageSize);

  return (
    <DataTableContainer
      initialData={result}
      headings={["ID", "Customer", "Active Jobs", "Invoices Pending", "Actions"]}
      getPageDataRoute="/api/customers"
      pageSize={pageSize}
      tableDataEntryComponent={CustomerTableBody}
    />
  );
}
