import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from "react";

import { ValidationResultErrors } from '@/app/core/types';

import { formFields } from "@/app/sign-in/constants";

import SignInInput from "./sign-in-input";

type PasswordInput = {
    defaultValue?: string;
    errors?: ValidationResultErrors;
}

export default function PasswordInput({ defaultValue, errors }: PasswordInput) {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const hasError = !!errors?.fields && !!errors.fields.find(f => f === "password");
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
            errors={errors}
            type={showPassword ? 'text' : 'password'} 
        />
    );
}