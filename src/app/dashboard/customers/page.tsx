'use client';

import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";

import { PageHeader } from "@/app/core/components/ui/page/header";
import { ActionButton } from "@/app/core/components/ui/forms/buttons";

import { AddCustomerDialog } from "./components";

export default function CustomersPage() {
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const handleCancelPressed = () => setAddCustomerDialogOpen(false);
  
  const addButton = (
    <ActionButton
      text="Add customer"
      icon={<AddIcon />}
      onClick={() => setAddCustomerDialogOpen(true)}
    />
  );

  return (
    <>
      <PageHeader title="Customers" breadcrumbsKey="customers" actionItem={addButton} />
      <AddCustomerDialog
        open={addCustomerDialogOpen}
        cancelPressed={handleCancelPressed}
      />
    </>
  );
}
