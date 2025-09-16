import { TextField } from '@mui/material';
import { HTMLInputTypeAttribute, JSX } from 'react';

import { ValidationResultErrors } from '@/app/core/types';

type OutlineInputProps = {
    fieldName: string;
    endAdornment?: JSX.Element;
    errors: string | ValidationResultErrors | undefined;
    defaultValue?: string;
    label?: string;
    type?: HTMLInputTypeAttribute;
}

export default function OutlineInput({
    defaultValue,
    endAdornment,
    errors,
    fieldName,
    label,
    type
}: OutlineInputProps) {
    const hasValidationErrors = !!errors && typeof errors !== 'string';
    const validationErrors = hasValidationErrors ? errors as ValidationResultErrors : undefined;
    const hasError = !!validationErrors?.fields && 
        !!validationErrors.fields.find(f => f === fieldName);
            
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