'use client';

import React, { useRef } from "react";

import { FormDialogWrapper } from "@/app/core/components/ui/dialogs";

import AddCustomerForm, { AddCustomerFormHandle } from "./add-customer-form";

type AddCustomerDialogProps = {
  open: boolean;
  cancelPressed: () => void;
}

export default function AddCustomerDialog({ open, cancelPressed }: AddCustomerDialogProps) {
  const formRef = useRef<AddCustomerFormHandle>(null);

  return (
    <FormDialogWrapper
      open={open}
      title="Add Customer"
      onClose={cancelPressed}
      formRef={formRef}
      submitLabel="Create"
      cancelLabel="Cancel"
    >
      <AddCustomerForm ref={formRef} />
    </FormDialogWrapper>
  );
}
