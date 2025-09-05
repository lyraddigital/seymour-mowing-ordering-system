import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";

import { DataRefreshProvider } from "@/app/core/components/providers";
import { PageHeader } from "@/app/core/components/ui/page/header";

import { AddCustomerDialog, CustomersTableAsync } from "./components";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return (
    <DataRefreshProvider>
      <PageHeader title="Customers" breadcrumbsKey="customers" actionItem={<AddCustomerDialog />} />
      <Suspense fallback={(
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}>
        <CustomersTableAsync />
      </Suspense>
    </DataRefreshProvider>
  );
}
