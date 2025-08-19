"use client";

import { TextField } from '@mui/material';
import { HTMLInputTypeAttribute, JSX } from 'react';

import { ValidationResult } from '@/app/core/validators';

type SignInInputProps<T> = {
    fieldName: string;
    endAdornment?: JSX.Element;
    validationResult?: ValidationResult<T>;
    defaultValue?: string;
    label?: string;
    type?: HTMLInputTypeAttribute;
}

export default function SignInInput<T>({
    defaultValue,
    endAdornment,
    validationResult,
    fieldName,
    label,
    type
}: SignInInputProps<T>) {
    const hasError = !!validationResult?.errors?.fields && 
        !!validationResult.errors.fields.find(f => f === fieldName);
    
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