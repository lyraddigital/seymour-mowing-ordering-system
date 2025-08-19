'use client';

import { Box, Button, Checkbox, FormControlLabel } from "@mui/material";

import { FormActionAlerts } from "@/app/core/components/ui/forms";
import { useFormAction } from "@/app/core/hooks";

import { signInWithCredentials } from "@/app/sign-in/actions";
import { formFields } from "@/app/sign-in/constants";
import { validateSignIn } from "@/app/sign-in/validators";

import SignInInput from "./sign-in-input";
import PasswordInput from "./password-input";

export default function SignInForm() {
    const [state, action, pending] = useFormAction(validateSignIn, signInWithCredentials);    

    return (
        <Box component="form" action={action} noValidate autoComplete="off" sx={{ m: 1 }}>
            <FormActionAlerts state={state}></FormActionAlerts>            
            <Box sx={{mb: 1}}>
                <SignInInput fieldName={formFields.username} validationResult={state?.validationResult} label="Username *" defaultValue={state?.data?.username} />
            </Box>
            <Box sx={{mb: 1}}>
                <PasswordInput validationResult={state?.validationResult} defaultValue={state?.data?.password} />
            </Box>
            <Box sx={{mt: 2, mb: 3}}>
                <FormControlLabel control={<Checkbox name={formFields.rememberMe} defaultValue={state?.data?.rememberMe} />} label="Remember me" />                
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