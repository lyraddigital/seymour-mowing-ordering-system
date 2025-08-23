import { Box, TextField, Avatar, Button } from "@mui/material";
import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from "react";

import { useFormAction } from "@/app/core/hooks";

import { createCustomer } from "@/app/dashboard/customers/actions";
import { formFields } from "@/app/dashboard/customers/constants";
import { validateCustomerCreation } from "@/app/dashboard/customers/validators";

export interface AddCustomerFormHandle {
  submit: () => void;
}

const AddCustomerForm = forwardRef<AddCustomerFormHandle, {}>((_, ref) => {
  const [state, action, pending] = useFormAction(validateCustomerCreation, createCustomer);
  const formRef = useRef<HTMLFormElement>(null);
  const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  }));

  useEffect(() => {
    // Optionally clear image on unmount or dialog close
  }, []);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePic(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // The form will submit via the action prop, so no need for custom handleSubmit

  return (
    <Box
      component="form"
      ref={formRef}
      action={action}
      noValidate
      autoComplete="off"
      sx={{ mt: 2 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Avatar src={profilePic} sx={{ width: 80, height: 80, mb: 3 }} />
        <Button
          variant="outlined"
          size="small"
          onClick={() => fileInputRef.current?.click()}
          sx={{ mb: 1 }}
        >
          Upload Profile Picture
        </Button>
        <input
          type="file"
          name={formFields.profilePic}
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleProfilePicChange}
        />
      </Box>
      <TextField label="Customer Name" name={formFields.customerName} variant="outlined" fullWidth sx={{ mb: 2 }} defaultValue={state?.data?.customerName} />
      <TextField label="Contact Name" name={formFields.contactName} variant="outlined" fullWidth sx={{ mb: 2 }} defaultValue={state?.data?.contactName} />
      <TextField type="email" label="Contact Email" name={formFields.contactEmail} variant="outlined" fullWidth sx={{ mb: 2 }} defaultValue={state?.data?.contactEmail} />
      <TextField type="tel" label="Contact Phone" name={formFields.contactPhone} variant="outlined" fullWidth sx={{ mb: 2 }} defaultValue={state?.data?.contactPhone} />
      {/* You can use pending to disable the dialog's Create button via props if needed */}
    </Box>
  );
});

export default AddCustomerForm;
