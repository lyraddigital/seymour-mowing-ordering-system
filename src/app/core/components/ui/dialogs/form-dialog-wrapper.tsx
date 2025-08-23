import React from "react";
import { Button } from "@mui/material";
import DialogWrapper from "./dialog-wrapper";

interface FormDialogWrapperProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  formRef: React.Ref<{ submit: () => void }>;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: string;
  children: React.ReactNode;
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
