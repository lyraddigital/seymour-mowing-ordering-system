import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from "react";

import { ValidationResult } from '@/app/core/validators';

import { formFields } from "@/app/sign-in/constants";

import SignInInput from "./sign-in-input";

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
        <SignInInput 
            fieldName={formFields.password}
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