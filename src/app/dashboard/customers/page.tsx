
import { Suspense } from "react";

import { PageHeader } from "@/app/core/components/ui/page/header";

import { AddCustomerDialog, CustomersTableAsync } from "./components";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" breadcrumbsKey="customers" actionItem={<AddCustomerDialog />} />
      <Suspense fallback={<div>Loading customers...</div>}>
        <CustomersTableAsync />
      </Suspense>
    </>
  );
}
