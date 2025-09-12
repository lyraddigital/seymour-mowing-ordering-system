import { DataRefreshProvider, DatasourceProvider } from "@/app/core/components/providers";
import { PageHeader } from "@/app/core/components/ui/page/header";
import { getCustomersPage } from "@/app/core/data";
import { SearchParams } from "@/app/core/types";

import { AddCustomerDialog, CustomerDatasource } from "./components";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: SearchParams;
};

export default function CustomersPage({ searchParams }: CustomersPageProps) {
  return (
    <DataRefreshProvider>
      <PageHeader title="Customers" breadcrumbsKey="customers" actionItem={<AddCustomerDialog />} />
      <DatasourceProvider
        getPageDataRoute="/api/customers"
        initialSourceFn={getCustomersPage}
        ResultComponent={CustomerDatasource}
        querySearchParams={searchParams}
      />
    </DataRefreshProvider>
  );
}
