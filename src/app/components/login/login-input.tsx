import { TextField } from '@mui/material';
import { HTMLInputTypeAttribute, JSX } from 'react';

type LoginInputProps = {
    fieldName: string;
    endAdornment?: JSX.Element;
    error?: boolean;
    label?: string;
    type?: HTMLInputTypeAttribute;
}

export default function LoginInput({ endAdornment, error, fieldName, label, type }: LoginInputProps) {
    return <TextField
        id={fieldName}
        name={fieldName}
        autoComplete='off'
        label={label} 
        type={type}
        error={error}
        slotProps={{            
            input: { endAdornment }
        }}
        variant="outlined" 
        fullWidth />;    
}