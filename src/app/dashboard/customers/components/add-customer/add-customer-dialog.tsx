'use client';

import AddIcon from "@mui/icons-material/Add";
import { useCallback, useState } from "react";

import { FormDialogWrapper } from "@/app/core/components/ui/dialogs";
import { ActionButton } from "@/app/core/components/ui/forms/buttons";
import { useDataTriggerRefresh } from "@/app/core/hooks";

import { validateCustomerCreation } from "@/app/dashboard/customers/validators";
import { createCustomer } from "@/app/dashboard/customers/actions";

import AddCustomerFields from "./add-customer-fields";

export default function AddCustomerDialog() {
  const triggerRefresh = useDataTriggerRefresh();
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => setOpen(true);
  const handleClose = useCallback((isSuccessful: boolean) => {
    setOpen(false);

    if (isSuccessful) {
      triggerRefresh?.();
    }
  }, [setOpen, triggerRefresh]);

  return (
    <>
      <ActionButton
        text="Add customer"
        icon={<AddIcon />}
        onClick={handleOpen}
      />
      {open && (
        <FormDialogWrapper
          title="Add Customer"
          onClose={handleClose}
          validateFn={validateCustomerCreation}
          actionFn={createCustomer}
          submitLabel="Create"
          cancelLabel="Cancel"
        >
          <AddCustomerFields />
        </FormDialogWrapper>
      )}
    </>
  );
}
