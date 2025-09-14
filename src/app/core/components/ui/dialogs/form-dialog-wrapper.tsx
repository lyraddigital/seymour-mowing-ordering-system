import { Button, CircularProgress, Box } from "@mui/material";
import React, { ReactElement, useCallback, useEffect } from "react";

import { useFormAction } from "@/app/core/hooks";
import { FormActionState } from "@/app/core/types";
import { ActionStateFn, ValidatorFn } from "@/app/core/validators";

import DialogWrapper from "./dialog-wrapper";

type FormDialogWrapperProps<T> = {
  title: React.ReactNode;
  onClose: (isSuccessfulSubmission: boolean) => void;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: string;
  validateFn: ValidatorFn<T>;
  actionFn: ActionStateFn<T>;
  children: ReactElement<{ state: FormActionState<T> | undefined }>;
}

export default function FormDialogWrapper<T>({
  title,
  onClose,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  maxWidth = "500px",
  validateFn,
  actionFn,
  children,
}: FormDialogWrapperProps<T>) {
  const [state, action, pending] = useFormAction<T>(validateFn, actionFn);

  useEffect(() => {
    if (!pending && state?.isSuccessful) {
      onClose(true);
    }
  }, [state, pending, onClose]);

  const onDialogClose = useCallback(() => {
    onClose(false);
  }, [onClose]);

  return (
    <DialogWrapper
      open={true}
      title={title}
      onClose={onDialogClose}
      closeDisabled={pending}
      maxWidth={maxWidth}
      actions={
        <>
          <Button onClick={onDialogClose} disabled={pending}>{cancelLabel}</Button>
          <Button
            variant="contained"
            type="submit"
            form="dialog-form"
            disabled={pending}
            startIcon={pending ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <Box
        component="form"
        id="dialog-form"
        action={action}
        noValidate
        autoComplete="off"
        sx={{ mt: 2 }}
      >
        {React.cloneElement(children, { state })}
      </Box>
    </DialogWrapper>
  );
}
