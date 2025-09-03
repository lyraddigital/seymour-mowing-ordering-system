import { DataTableContainer } from "@/app/core/components/ui/tables";
import { getCustomersPage } from "@/app/core/data";

import CustomerTableBody from "./customer-table-body";

export default async function CustomersTableAsync() {
  const pageSize = 10;
  const result = await getCustomersPage(1, pageSize);

  return (
    <DataTableContainer
      initialData={result}
      headings={["Customer Number", "Customer Name", "Contact Name", "Contact Email", "Contact Phone", "Profile Pic Url"]}
      getPageDataRoute="/api/customers"
      pageSize={pageSize}
      tableDataEntryComponent={CustomerTableBody}
    />
  );
}
