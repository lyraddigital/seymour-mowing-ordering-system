import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from "react";

import { ValidationResultErrors } from '@/app/core/types';

import OutlineInput from "./outline-input";

type OutlinePasswordInputProps = {
    defaultValue?: string;
    errors: string | ValidationResultErrors | undefined;
    fieldName: string;
}

export default function OutlinePasswordInput({ defaultValue, errors, fieldName }: OutlinePasswordInputProps) {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const hasValidationErrors = !!errors && typeof errors !== 'string';
    const validationErrors = hasValidationErrors ? errors as ValidationResultErrors : undefined;
    const hasError = !!validationErrors?.fields && 
        !!validationErrors.fields.find(f => f === fieldName);
    const visibilityColor = hasError ? "error": undefined;

    return (
        <OutlineInput 
            fieldName={fieldName}
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