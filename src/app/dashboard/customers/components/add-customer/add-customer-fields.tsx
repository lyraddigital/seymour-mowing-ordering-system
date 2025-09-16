import { Box } from "@mui/material";
import { FC } from "react";

import { OutlineInput, PicUploader } from "@/app/core/components/ui/forms/inputs";
import { FormActionState } from "@/app/core/types";

import { formFields } from "@/app/dashboard/customers/constants";
import { CreateCustomer } from "@/app/dashboard/customers/types";

type AddCustomerFieldsProps = {
  state?: FormActionState<CreateCustomer>;
};

const AddCustomerFields: FC<AddCustomerFieldsProps> = ({ state }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <PicUploader fieldName={formFields.profilePic} />
      </Box>
      <Box>
        <OutlineInput fieldName={formFields.customerName} errors={state?.error} label="Customer Name" defaultValue={state?.data?.customerName} />
      </Box>
      <Box sx={{mt: 2}}>
        <OutlineInput fieldName={formFields.contactName} errors={state?.error} label="Contact Name" defaultValue={state?.data?.contactName} />
      </Box>
      <Box sx={{mt: 2}}>
        <OutlineInput fieldName={formFields.contactEmail} errors={state?.error} label="Contact Email" defaultValue={state?.data?.contactEmail} />
      </Box>
      <Box sx={{mt: 2}}>
        <OutlineInput fieldName={formFields.contactPhone} errors={state?.error} label="Contact Phone" defaultValue={state?.data?.contactPhone} />
      </Box>
    </Box>
  );
};

export default AddCustomerFields;
