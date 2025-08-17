'use client';

import { Box, Button, Checkbox, FormControlLabel } from "@mui/material";

import { signInWithCredentials } from "@/app/actions";
import { FormActionAlerts } from "@/app/components/ui/forms";
import { useFormAction } from "@/app/hooks";
import { validateSignIn } from "@/app/validators";

import LoginInput from "./login-input";
import PasswordInput from "./password-input";

export default function LoginForm() {
    const [state, action, pending] = useFormAction(validateSignIn, signInWithCredentials);    

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