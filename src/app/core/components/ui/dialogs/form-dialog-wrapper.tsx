import React, { PropsWithChildren } from "react";
import { Button } from "@mui/material";
import DialogWrapper from "./dialog-wrapper";

type FormDialogWrapperProps = PropsWithChildren & {
    cancelLabel?: string;
    formRef: React.Ref<{ submit: () => void }>;
    maxWidth?: string;
    onClose: () => void;
    open: boolean;
    submitLabel?: string;
    title: React.ReactNode;
}

export default function FormDialogWrapper({
  open,
  title,
  onClose,
  formRef,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  maxWidth = "500px",
  children,
}: FormDialogWrapperProps) {
  const handleSubmit = () => {
    if (formRef && typeof formRef !== "function" && formRef.current?.submit) {
      formRef.current.submit();
    }
  };

  return (
    <DialogWrapper
      open={open}
      title={title}
      onClose={onClose}
      maxWidth={maxWidth}
      actions={
        <>
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button variant="contained" onClick={handleSubmit}>{submitLabel}</Button>
        </>
      }
    >
      {children}
    </DialogWrapper>
  );
}
