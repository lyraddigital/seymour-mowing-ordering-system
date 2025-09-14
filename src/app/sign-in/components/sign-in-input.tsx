import { TextField } from '@mui/material';
import { HTMLInputTypeAttribute, JSX } from 'react';

import { ValidationResultErrors } from '@/app/core/types';

type SignInInputProps = {
    fieldName: string;
    endAdornment?: JSX.Element;
    errors?: ValidationResultErrors;
    defaultValue?: string;
    label?: string;
    type?: HTMLInputTypeAttribute;
}

export default function SignInInput({
    defaultValue,
    endAdornment,
    errors,
    fieldName,
    label,
    type
}: SignInInputProps) {
    const hasError = !!errors?.fields && 
        !!errors.fields.find(f => f === fieldName);
    
    return <TextField
        id={fieldName}
        name={fieldName}
        defaultValue={defaultValue}
        autoComplete='off'
        label={label} 
        type={type}
        error={hasError}
        slotProps={{            
            input: { endAdornment }
        }}
        variant="outlined"
        fullWidth />;    
}