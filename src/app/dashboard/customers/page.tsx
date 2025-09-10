import { DataRefreshProvider, DatasourceProvider } from "@/app/core/components/providers";
import { PageHeader } from "@/app/core/components/ui/page/header";
import { getCustomersPage } from "@/app/core/data";

import { AddCustomerDialog, CustomerDatasource } from "./components";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return (
    <DataRefreshProvider>
      <PageHeader title="Customers" breadcrumbsKey="customers" actionItem={<AddCustomerDialog />} />
      <DatasourceProvider initialSourceFn={getCustomersPage} ResultComponent={CustomerDatasource} />              
    </DataRefreshProvider>
  );
}
