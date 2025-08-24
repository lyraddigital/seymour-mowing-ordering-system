import { Box, TextField, Avatar, Button } from "@mui/material";
import React, { useRef, useState } from "react";

import { FormActionState } from "@/app/core/types";

import { formFields } from "@/app/dashboard/customers/constants";
import { CreateCustomer } from "@/app/dashboard/customers/types";

type AddCustomerFieldsProps = {
  state?: FormActionState<CreateCustomer> | undefined;
};

const AddCustomerFields: React.FC<AddCustomerFieldsProps> = ({ state }) => {
  const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <Avatar src={profilePic} sx={{ width: 120, height: 120, mb: 3 }} />
        <Button
          variant="contained"
          size="small"
          onClick={() => fileInputRef.current?.click()}
          sx={{ mb: 1 }}
        >
          Upload
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
    </Box>
  );
};

export default AddCustomerFields;
