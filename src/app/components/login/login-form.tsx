'use client';

import { Box, Button, Checkbox, FormControlLabel } from "@mui/material";
import { useActionState } from "react";

import { signInWithCredentials } from "@/app/actions";
import { FormActionAlerts } from "@/app/components/ui/forms";
import { Credentials, FormActionState } from "@/app/types";
import { validateSignIn } from "@/app/validators";

import LoginInput from "./login-input";
import PasswordInput from "./password-input";

const handleSignInWithCredentials = async (prevState: FormActionState<Credentials> | undefined, formData: FormData): Promise<FormActionState<Credentials> | undefined> => {
    const validationResult = validateSignIn(formData);    

    if (!validationResult.success) {
        return {
            data: validationResult.data,
            validationResult: validationResult,
        };
    }

    return await signInWithCredentials(prevState, formData);
};

export default function LoginForm() {    
    const [state, action, pending] = useActionState(handleSignInWithCredentials, undefined);

    return (
        <Box component="form" action={action} noValidate autoComplete="off" sx={{ m: 1 }}>
            <FormActionAlerts state={state}></FormActionAlerts>            
            <Box sx={{mb: 1}}>
                <LoginInput fieldName="username" validationResult={state?.validationResult} label="Username *" defaultValue={state?.data?.username} />
            </Box>
            <Box sx={{mb: 1}}>
                <PasswordInput validationResult={state?.validationResult} defaultValue={state?.data?.password} />
            </Box>
            <Box sx={{mt: 2, mb: 3}}>
                <FormControlLabel control={<Checkbox name="rememberMe" defaultValue={state?.data?.rememberMe} />} label="Remember me" />                
            </Box>
            <Box sx={{mx: { sm: 8 }}}>                
                <Button 
                    type="submit"
                    disabled={pending}
                    loading={pending}
                    loadingPosition="start"
                    variant="contained"
                    size="large" color="secondary"
                    fullWidth
                    sx={{ borderRadius: 6 }}
                >Sign In</Button>
            </Box>
        </Box>
    );
}