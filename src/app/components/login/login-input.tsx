import { TextField } from '@mui/material';
import { HTMLInputTypeAttribute, JSX } from 'react';

type LoginInputProps = {
    endAdornment?: JSX.Element;
    label?: string;
    type?: HTMLInputTypeAttribute;
}

export default function LoginInput({ endAdornment, label, type }: LoginInputProps) {
    return <TextField
        autoComplete='off'
        label={label} 
        type={type}
        slotProps={{            
            input: { endAdornment }
        }}
        variant="outlined" 
        fullWidth />;    
}