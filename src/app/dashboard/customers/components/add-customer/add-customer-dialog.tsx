'use client';

import AddIcon from "@mui/icons-material/Add";
import React from "react";

import { FormDialogWrapper } from "@/app/core/components/ui/dialogs";
import { ActionButton } from "@/app/core/components/ui/forms/buttons";

import { validateCustomerCreation } from "@/app/dashboard/customers/validators";
import { createCustomer } from "@/app/dashboard/customers/actions";

import AddCustomerFields from "./add-customer-fields";

export default function AddCustomerDialog() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <ActionButton
        text="Add customer"
        icon={<AddIcon />}
        onClick={handleOpen}
      />
      <FormDialogWrapper
        open={open}
        title="Add Customer"
        onClose={handleClose}
        validateFn={validateCustomerCreation}
        actionFn={createCustomer}
        submitLabel="Create"
        cancelLabel="Cancel"
      >
        <AddCustomerFields />
      </FormDialogWrapper>
    </>
  );
}
