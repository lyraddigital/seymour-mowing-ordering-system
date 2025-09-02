import { PageHeader } from "@/app/core/components/ui/page/header";
import { getCustomersPage } from "@/app/core/data/customer.repository";

import DataTableContainer from "@/app/core/components/ui/tables/data-table-container";

import { AddCustomerDialog, CustomerTableBody } from "./components";

export default async function CustomersPage() {
  const pageSize = 1;  
  const result = await getCustomersPage(pageSize);

  return (
    <>
      <PageHeader title="Customers" breadcrumbsKey="customers" actionItem={<AddCustomerDialog />} />
      <DataTableContainer 
        initialData={result}
        headings={['Customer Number', 'Customer Name', 'Contact Name', 'Contact Email', 'Contact Phone', 'Profile Pic Url']}
        getPageDataRoute="/api/customers"
        pageSize={pageSize}
        tableDataEntryComponent={CustomerTableBody} />
    </>
  );
}
