'use client';

import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff, LockOutline } from '@mui/icons-material';
import { useState } from "react";

import LoginOutlinedInput from "./login-input";

type PasswordInput = {
    error?: boolean;
}

export default function PasswordInput({ error }: PasswordInput) {    
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <LoginOutlinedInput 
            fieldName="password"
            label="Password *"
            endAdornment={
                <InputAdornment position="end">
                    <IconButton
                        aria-label={
                            showPassword ? 'hide the password' : 'display the password'
                        }
                        onClick={handleClickShowPassword}
                        edge="end"
                        >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>
            }
            error={error}
            type={showPassword ? 'text' : 'password'} 
        />
    );
}