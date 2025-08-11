import { Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";

import LoginInput from "./login-input";
import PasswordInput from "./password-input";

export default function LoginForm() {
    return (
        <Box component="form" noValidate autoComplete="off" sx={{ m: 1 }}>
            <Box sx={{mb: 1}}>
                <LoginInput label="Username *" />
            </Box>
            <Box sx={{mb: 1}}>
                <PasswordInput />
            </Box>
            <Box sx={{mt: 2, mb: 3}}>
                <FormControlLabel control={<Checkbox />} label="Remember me" />                
            </Box>
            <Box sx={{mx: { sm: 8 }}}>
                <Button variant="contained" size="large" color="secondary" fullWidth sx={{ borderRadius: 6 }}>Sign In</Button>
            </Box>
        </Box>
    );
}