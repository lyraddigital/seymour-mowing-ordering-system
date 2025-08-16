'use client';

import { IconButton, InputAdornment, useTheme } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from "react";

import { ValidationResult } from '@/app/validators'; 
import LoginOutlinedInput from "./login-input";

type PasswordInput<T> = {
    defaultValue?: string;
    validationResult?: ValidationResult<T>;
}

export default function PasswordInput<T>({ defaultValue, validationResult }: PasswordInput<T>) {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const hasError = !!validationResult?.errors?.fields && !!validationResult.errors.fields.find(f => f === "password");
    const visibilityColor = hasError ? "error": undefined;

    return (
        <LoginOutlinedInput 
            fieldName="password"
            label="Password *"
            defaultValue={defaultValue}
            endAdornment={
                <InputAdornment position="end">
                    <IconButton
                        aria-label={
                            showPassword ? 'hide the password' : 'display the password'
                        }
                        onClick={handleClickShowPassword}
                        edge="end"
                        >
                        {showPassword ? <VisibilityOff color={visibilityColor} /> : <Visibility color={visibilityColor} />}
                    </IconButton>
                </InputAdornment>
            }
            validationResult={validationResult}
            type={showPassword ? 'text' : 'password'} 
        />
    );
}