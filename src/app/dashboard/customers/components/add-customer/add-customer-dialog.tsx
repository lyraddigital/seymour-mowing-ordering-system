'use client';

import React from "react";

import { FormDialogWrapper } from "@/app/core/components/ui/dialogs";

import { validateCustomerCreation } from "@/app/dashboard/customers/validators";
import { createCustomer } from "@/app/dashboard/customers/actions";

import AddCustomerFields from "./add-customer-fields";

type AddCustomerDialogProps = {
  open: boolean;
  cancelPressed: () => void;
};

export default function AddCustomerDialog({ open, cancelPressed }: AddCustomerDialogProps) {
  return (
    <FormDialogWrapper
      open={open}
      title="Add Customer"
      onClose={cancelPressed}
      validateFn={validateCustomerCreation}
      actionFn={createCustomer}
      submitLabel="Create"
      cancelLabel="Cancel"
    >        
        <AddCustomerFields />
    </FormDialogWrapper>
  );
}
