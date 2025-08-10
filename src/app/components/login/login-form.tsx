import { Box, Button, TextField } from "@mui/material";
import PasswordInput from "./password-input";

import styles from "./login-form.module.css";

export default function LoginForm() {
    return (
        <Box component="form" noValidate autoComplete="off" sx={{ m: 1 }}>
            <Box sx={{mb: 1}}>
                <TextField label="Username *" fullWidth classes={{
                    root: styles.loginInput
                }} />
            </Box>
            <Box sx={{mb: 1}}>
                <PasswordInput />
            </Box>
            <Box sx={{mt: 2, mb: 3}}>
                Remember me
            </Box>
            <Box sx={{mx: { sm: 8 }}}>
                <Button variant="contained" color="secondary" fullWidth sx={{ borderRadius: 4 }}>Sign In</Button>
            </Box>
        </Box>
    );
}